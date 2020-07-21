import moment from 'moment'
import first from 'lodash/first'
import lodashGet from 'lodash/get'
import lodashFilter from 'lodash/filter'
import slugify from 'slugify'
import { v4 as uuid } from 'uuid'
import { get, post, put, servicesAPI } from '../../../utils/client'
import { apiImageUrl, baseUrl, imageUrl } from '../../../utils/justgiving'
import { getUID, isEqual, required } from '../../../utils/params'
import { deserializeTotals } from '../../../utils/totals'
import jsonDate from '../../../utils/jsonDate'

export const deserializePage = page => {
  const shortName =
    page.shortName || page.pageShortName || (page.LinkPath || '').substring(1)

  const getImage = () => {
    return (
      page.defaultImage ||
      page.Logo ||
      page.Photo ||
      imageUrl(page.photo) ||
      imageUrl(lodashGet(page, 'pageImages[0]')) ||
      lodashGet(page, 'image.url') ||
      lodashGet(page, 'images[0].url') ||
      apiImageUrl(shortName)
    )
  }

  const getQrCodes = page => {
    const images = lodashGet(page, 'media.images', [])
    return lodashFilter(images, image => image.caption === 'qrcode')
  }

  const onlineAmount = parseFloat(
    page.totalRaisedOnline ||
      page.Amount ||
      page.raisedAmount ||
      page.amountRaised ||
      0
  )

  const offlineAmount = parseFloat(page.totalRaisedOffline || 0)
  const status = page.status || page.pageStatus

  return {
    active: status ? ['Inactive', 'Cancelled'].indexOf(status) === -1 : true,
    campaign: page.campaignGuid || page.Subtext || page.eventId || page.EventId,
    campaignDate: jsonDate(page.eventDate) || page.EventDate,
    charity: page.charity || page.CharityId,
    charityId: lodashGet(page, 'charity.id') || page.CharityId,
    coordinates: null,
    createdAt: jsonDate(page.createdDate) || page.CreatedDate,
    donationUrl: [
      baseUrl('link'),
      'v1/fundraisingpage/donate/pageId',
      page.pageId || page.Id
    ].join('/'),
    event: page.Subtext || page.eventId || page.EventId || page.eventName,
    expired: jsonDate(page.expiryDate) && moment(page.expiryDate).isBefore(),
    fitness: {},
    fitnessGoal: parseInt(page.pageSummaryWhat) || 0,
    fitnessDistanceTotal:
      lodashGet(page, 'fitness.totalAmount', 0) ||
      lodashGet(page, 'fitness.distance', 0),
    fitnessDurationTotal:
      lodashGet(page, 'fitness.totalAmountTaken', 0) ||
      lodashGet(page, 'fitness.duration', 0),
    fitnessElevationTotal: lodashGet(page, 'fitness.elevation', 0),
    groups: null,
    hasUpdatedImage:
      page.imageCount &&
      parseInt(page.imageCount - getQrCodes(page).length) > 1,
    id: page.pageId || page.Id,
    image:
      getImage() &&
      getImage().split('?')[0] + '?template=CrowdfundingOwnerAvatar',
    name:
      page.title ||
      page.pageTitle ||
      page.Name ||
      page.name ||
      page.PageName ||
      lodashGet(page, 'pageOwner.fullName'),
    owner:
      page.owner ||
      page.OwnerFullName ||
      page.PageOwner ||
      lodashGet(page, 'pageOwner.fullName'),
    qrCodes: getQrCodes(page),
    raised: onlineAmount + offlineAmount,
    raisedOnline: onlineAmount,
    raisedOffline: offlineAmount,
    segmentation: deserializeSegmentation(page.tags),
    slug: shortName,
    story: page.story || page.ProfileWhat || page.ProfileWhy,
    tags: page.tags || [],
    target: parseFloat(
      page.fundraisingTarget ||
        page.TargetAmount ||
        page.targetAmount ||
        page.target ||
        0
    ),
    teamPageId:
      page.teams && page.teams.length > 0 ? page.teams[0].teamGuid : null,
    teamShortName:
      page.teams && page.teams.length > 0 ? page.teams[0].teamShortName : null,
    type: page.type || 'individual',
    url: page.Link || page.PageUrl || `${baseUrl()}/fundraising/${shortName}`,
    uuid: page.pageGuid || page.fundraisingPageGuid
  }
}

const deserializeSegmentation = (tags = []) => {
  return tags.reduce((segments, tag) => {
    const key = lodashGet(tag, 'tagDefinition.id')
    const value = lodashGet(tag, 'value')

    return {
      ...segments,
      [key]: value
    }
  }, {})
}

const recursivelyFetchJGPages = (campaign, page = 1, results = []) =>
  servicesAPI
    .get(`/v1/justgiving/campaigns/${campaign}/pages`, { params: { page } })
    .then(response => response.data)
    .then(data => {
      const { currentPage, totalPages } = data.meta
      const updatedResults = [...results, ...data.results]
      if (Number(currentPage) === totalPages) {
        return updatedResults
      } else {
        return recursivelyFetchJGPages(campaign, page + 1, updatedResults)
      }
    })

export const fetchPages = (params = required()) => {
  const {
    allPages,
    authType = 'Basic',
    campaign,
    charity,
    event,
    ids,
    token,
    userPages,
    ...args
  } = params

  if (userPages && token) {
    return get(
      '/v1/fundraising/pages',
      {},
      {},
      {
        headers: {
          Authorization: [authType, token].join(' ')
        }
      }
    )
  }

  if (allPages && ids) {
    const pageIds = Array.isArray(ids) ? ids : ids.split(',')

    return Promise.all(pageIds.map(fetchPage))
  }

  if (allPages && event) {
    const mappings = { limit: 'pageSize' }

    return get(`/v1/event/${getUID(event)}/pages`, args, { mappings })
      .then(response => response.fundraisingPages)
      .then(pages =>
        pages.map(page => ({
          ...page,
          totalRaisedOffline: page.raisedAmount - page.totalRaisedOnline
        }))
      )
  }

  if (campaign && !event) {
    return recursivelyFetchJGPages(campaign)
  }

  return get('/v1/onesearch', {
    campaignId: getUID(campaign),
    charityId: getUID(charity),
    eventId: getUID(event),
    i: 'Fundraiser',
    ...args
  }).then(
    response =>
      (response.GroupedResults &&
        response.GroupedResults.length &&
        response.GroupedResults[0].Results) ||
      []
  )
}

export const fetchPage = (page = required(), slug, options = {}) => {
  const endpoint = slug ? 'pages' : isNaN(page) ? 'pages' : 'pagebyid'

  const fetchers = [
    new Promise(resolve =>
      get(`/v1/fundraising/${endpoint}/${page}`).then(
        page =>
          options.includeFitness
            ? fetchPageFitness(page, options.useLegacy).then(fitness =>
              resolve({ ...page, fitness })
            )
            : resolve(page)
      )
    ),
    options.includeTags && fetchPageTags(page)
  ]

  return Promise.all(fetchers).then(([page, tags]) => ({
    ...page,
    ...tags
  }))
}

export const fetchUserPages = ({
  authType = 'Basic',
  campaign,
  charity,
  event,
  token = required()
}) => {
  const headers = {
    Authorization: [authType, token].join(' ')
  }

  const filterByCampaign = (pages, campaign) =>
    campaign
      ? pages.filter(page => isEqual(page.campaignGuid, campaign))
      : pages

  const filterByCharity = (pages, charity) =>
    charity ? pages.filter(page => isEqual(page.charityId, charity)) : pages

  const filterByEvent = (pages, event) =>
    event ? pages.filter(page => isEqual(page.eventId, event)) : pages

  return get('/v1/fundraising/pages', {}, {}, { headers })
    .then(pages => filterByCampaign(pages, campaign))
    .then(pages => filterByCharity(pages, charity))
    .then(pages => filterByEvent(pages, event))
}

export const fetchPageTags = page => {
  return get(`v1/tags/${page}`)
}

const fetchPageFitness = (page, useLegacy) => {
  if (useLegacy) {
    return get(`/v1/fitness/fundraising/${page.pageShortName}`)
  }

  const query = `
    {
      totals(
        segment: "page:totals",
        tagDefinitionId: "page:totals",
        tagValue: "page:fundraising:${page.pageGuid}"
      ) {
        measurementDomain
        amounts {
          value
          unit
        }
      }
    }
  `

  return servicesAPI
    .post('/v1/justgiving/graphql', { query })
    .then(response => response.data)
    .then(result => lodashGet(result, 'data.totals', []))
    .then(deserializeTotals)
}

export const fetchPageDonationCount = (page = required()) => {
  return get(`/v1/fundraising/pages/${page}/donations`).then(
    data => data.pagination.totalResults
  )
}

const truncate = (string, length = 50) => {
  if (string) {
    return String(string).length > length
      ? String(string)
        .substring(0, length - 3)
        .trim() + '...'
      : String(string)
  }

  return undefined
}

export const createPageTag = ({
  id = required(),
  label = required(),
  slug = required(),
  value = required(),
  aggregation = []
}) => {
  const request = () =>
    post(
      `/v1/tags/${slug}`,
      {
        aggregation,
        id,
        label,
        value
      },
      {
        timeout: 5000
      }
    )

  return request().catch(() => request()) // Retry if request fails
}

export const createPageTags = page =>
  Promise.all(
    [
      {
        id: 'page:totals',
        label: 'Page Totals'
      },
      {
        id: 'page:charity',
        label: 'Charity Link',
        value: `page:charity:${page.charityId}`,
        segment: `page:charity:${page.charityId}`
      },
      {
        id: `page:charity:${page.charityId}`,
        label: 'Page Charity Link'
      },
      {
        id: 'page:event',
        label: 'Event Link',
        value: `page:event:${page.event}`,
        segment: `page:event:${page.event}`
      },
      {
        label: 'Page Event Link',
        id: `page:event:${page.event}`
      },
      page.campaign && {
        id: 'page:campaign',
        label: 'Campaign Link',
        value: `page:campaign:${page.campaign}`,
        segment: `page:campaign:${page.campaign}`
      },
      page.campaign && {
        id: 'page:campaign:charity',
        label: 'Charity Campaign Link',
        value: `page:campaign:${page.campaign}:charity:${page.charityId}`,
        segment: `page:campaign:${page.campaign}:charity:${page.charityId}`
      },
      page.campaign && {
        label: 'Page Campaign Link',
        id: `page:campaign:${page.campaign}`
      },
      page.campaign && {
        label: 'Page Charity Campaign Link',
        id: `page:campaign:${page.campaign}:charity:${page.charityId}`
      }
    ]
      .filter(Boolean)
      .map(({ label, id, value, segment }) =>
        createPageTag({
          slug: page.slug,
          label,
          id,
          value: value || `page:fundraising:${page.uuid}`,
          aggregation: [
            {
              segment: segment || id,
              measurementDomains: ['all']
            }
          ]
        })
      )
  )

export const createPage = ({
  charityId = required(),
  title = required(),
  token = required(),
  slug,
  activityType = 'othercelebration',
  attribution,
  authType = 'Basic',
  campaignId,
  campaignGuid,
  causeId,
  charityFunded,
  charityOptIn = false,
  companyAppealId,
  consistentErrorResponses,
  currency,
  customCodes,
  eventDate,
  eventId,
  eventName,
  expiryDate,
  giftAid,
  image,
  images = [],
  reference,
  rememberedPersonReference,
  story,
  summaryWhat,
  summaryWhy,
  tags,
  tagsCallback,
  target,
  teamId,
  theme,
  videos
}) => {
  return getPageShortName(title, slug).then(pageShortName => {
    return put(
      '/v1/fundraising/pages',
      {
        ...(eventId
          ? {
            eventId
          }
          : {
            activityType,
            eventDate,
            eventName: eventName || title
          }),
        attribution,
        campaignGuid: campaignGuid || campaignId,
        causeId,
        charityFunded,
        charityId,
        charityOptIn,
        companyAppealId,
        consistentErrorResponses,
        currency,
        customCodes,
        expiryDate,
        images: images.length
          ? images
          : image
            ? [{ url: image, isDefault: true }]
            : undefined,
        isGiftAidable: giftAid,
        pageShortName,
        pageStory: story,
        pageSummaryWhat: summaryWhat,
        pageSummaryWhy: truncate(summaryWhy),
        pageTitle: title,
        reference,
        rememberedPersonReference,
        tags,
        targetAmount: target,
        teamId,
        theme,
        videos
      },
      {
        headers: {
          Authorization: [authType, token].join(' ')
        }
      }
    )
      .then(result => fetchPage(result.pageId))
      .then(page => {
        createPageTags(deserializePage(page)).then(tags => {
          if (typeof tagsCallback === 'function') {
            tagsCallback(tags, page)
          }
        })

        return page
      })
  })
}

export const getPageShortName = (title, slug) => {
  const params = {
    preferredName: slug || slugify(title, { lower: true, strict: true })
  }

  return get('/v1/fundraising/pages/suggest', params).then(
    result => first(result.Names) || uuid()
  )
}

export const updatePage = (
  slug = required(),
  {
    token = required(),
    attribution,
    authType = 'Basic',
    image,
    name,
    offline,
    story,
    summaryWhat,
    summaryWhy,
    target
  }
) => {
  const config = { headers: { Authorization: [authType, token].join(' ') } }

  return Promise.all(
    [
      attribution &&
        put(
          `/v1/fundraising/pages/${slug}/attribution`,
          { attribution },
          config
        ),
      image &&
        put(
          `/v1/fundraising/pages/${slug}/images`,
          { url: image, isDefault: true },
          config
        ),
      name &&
        put(
          `/v1/fundraising/pages/${slug}/pagetitle`,
          { pageTitle: name },
          config
        ),
      offline &&
        put(
          `/v1/fundraising/pages/${slug}/offline`,
          { amount: offline },
          config
        ),
      story &&
        put(`/v1/fundraising/pages/${slug}/pagestory`, { story }, config),
      target &&
        put(`/v1/fundraising/pages/${slug}/target`, { amount: target }, config),
      (summaryWhat || summaryWhy) &&
        put(
          `/v1/fundraising/pages/${slug}/summary`,
          {
            pageSummaryWhat: summaryWhat,
            pageSummaryWhy: summaryWhy
          },
          config
        )
    ].filter(promise => promise)
  )
}
