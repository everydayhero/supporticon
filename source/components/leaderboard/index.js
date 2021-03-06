import React, { Component } from 'react'
import orderBy from 'lodash/orderBy'
import PropTypes from 'prop-types'
import numbro from 'numbro'
import { isJustGiving } from '../../utils/client'

import Filter from 'constructicon/filter'
import Grid from 'constructicon/grid'
import LeaderboardItem from 'constructicon/leaderboard-item'
import LeaderboardWrapper from 'constructicon/leaderboard'
import Pagination from 'constructicon/pagination'
import PaginationLink from 'constructicon/pagination-link'
import RichText from 'constructicon/rich-text'
import Section from 'constructicon/section'

import { fetchLeaderboard, deserializeLeaderboard } from '../../api/leaderboard'

class Leaderboard extends Component {
  constructor () {
    super()
    this.fetchLeaderboard = this.fetchLeaderboard.bind(this)
    this.setFilter = this.setFilter.bind(this)
    this.renderLeader = this.renderLeader.bind(this)
    this.state = {
      status: 'fetching',
      q: null
    }
  }

  componentDidMount () {
    const { refreshInterval } = this.props
    this.fetchLeaderboard()
    this.interval =
      refreshInterval &&
      setInterval(
        () => this.fetchLeaderboard(this.state.q, true),
        refreshInterval
      )
  }

  componentWillUnmount () {
    clearInterval(this.interval)
  }

  componentDidUpdate (prevProps) {
    if (this.props !== prevProps) {
      this.fetchLeaderboard(this.state.q)
    }
  }

  setFilter (filterValue) {
    const q = filterValue || null
    this.setState({ q })
    this.fetchLeaderboard(q)
  }

  removeExcludedGroups (groups, values) {
    if (!values) return groups

    return groups.filter(item => {
      const excluded = Array.isArray(values) ? values : values.split(',')
      return excluded.indexOf(item.tagValue.toString()) === -1
    })
  }

  handleData (data, excludeOffline, deserializeMethod, limit) {
    const leaderboardData = data
      .filter(item => item.status !== 'Cancelled')
      .map(deserializeMethod)
      .map(
        item =>
          excludeOffline
            ? { ...item, raised: item.raised - item.offline }
            : item
      )

    return orderBy(leaderboardData, ['raised'], ['desc'])
      .map((item, index) => ({ ...item, position: index + 1 }))
      .slice(0, limit)
  }

  fetchLeaderboard (q, refresh) {
    const {
      allPages,
      campaign,
      charity,
      country,
      deserializeMethod,
      endDate,
      event,
      excludeOffline,
      excludePageIds,
      group,
      groupID,
      limit,
      maxAmount,
      minAmount,
      page,
      pageIds,
      startDate,
      tagId,
      tagValue,
      type
    } = this.props

    !refresh &&
      this.setState({
        status: 'fetching',
        data: undefined
      })

    fetchLeaderboard({
      allPages,
      campaign,
      charity,
      country,
      endDate,
      event,
      excludePageIds: type === 'group' ? undefined : excludePageIds,
      group,
      groupID,
      limit: isJustGiving() ? limit : limit + 5,
      maxAmount,
      minAmount,
      page,
      pageIds,
      q,
      startDate,
      tagId,
      tagValue,
      type
    })
      .then(
        data =>
          type === 'group'
            ? this.removeExcludedGroups(data, excludePageIds)
            : data
      )
      .then(data => {
        this.setState({
          status: 'fetched',
          data: this.handleData(
            data,
            excludeOffline,
            deserializeMethod || deserializeLeaderboard,
            limit
          )
        })
      })
      .catch(error => {
        this.setState({
          status: 'failed'
        })
        return Promise.reject(error)
      })
  }

  render () {
    const { status, data = [] } = this.state
    const { leaderboard, filter, pageSize, showPage } = this.props

    return (
      <div>
        {filter && <Filter onChange={this.setFilter} {...filter} />}
        {status === 'fetching' || status === 'failed' ? (
          <LeaderboardWrapper
            {...leaderboard}
            loading={status === 'fetching'}
            error={status === 'failed'}
          />
        ) : data.length ? (
          <Pagination max={pageSize} toPaginate={data}>
            {({
              currentPage,
              isPaginated,
              prev,
              next,
              canPrev,
              canNext,
              pageOf
            }) => (
              <React.Fragment>
                <LeaderboardWrapper {...leaderboard}>
                  {currentPage.map(this.renderLeader)}
                </LeaderboardWrapper>
                {pageSize &&
                  isPaginated && (
                  <Section spacing={{ t: 0.5 }}>
                    <Grid align='center' justify='center'>
                      <PaginationLink
                        onClick={prev}
                        direction='prev'
                        disabled={!canPrev}
                      />
                      {showPage && <RichText size={-1}>{pageOf}</RichText>}
                      <PaginationLink
                        onClick={next}
                        direction='next'
                        disabled={!canNext}
                      />
                    </Grid>
                  </Section>
                )}
              </React.Fragment>
            )}
          </Pagination>
        ) : (
          <LeaderboardWrapper {...leaderboard} empty />
        )}
      </div>
    )
  }

  renderLeader (leader, i) {
    const {
      currency,
      format,
      leaderboardItem = {},
      multiplier,
      subtitleMethod,
      offset
    } = this.props
    const formatMethod = currency ? 'formatCurrency' : 'format'

    return (
      <LeaderboardItem
        key={i}
        title={leader.name}
        subtitle={subtitleMethod(leader)}
        image={leader.image}
        amount={numbro((offset + leader.raised) * multiplier)[formatMethod](
          format
        )}
        href={leader.url}
        rank={leader.position}
        {...leaderboardItem}
      />
    )
  }
}

Leaderboard.propTypes = {
  /**
   * The campaign uid to fetch pages for
   */
  campaign: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.array
  ]),

  /**
   * The charity uid to fetch pages for
   */
  charity: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.array
  ]),

  /**
   * The event uid to fetch pages for (JG only)
   */
  event: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object,
    PropTypes.array
  ]),

  /**
   * Country code for API (JG only)
   */
  country: PropTypes.oneOf([
    'au',
    'ca',
    'gb',
    'hk',
    'ie',
    'nz',
    'sg',
    'uk',
    'us',
    'za'
  ]),

  /**
   * The type of page to include in the leaderboard
   */
  type: PropTypes.oneOf(['group', 'individual', 'team']),

  /**
   * The group value(s) to filter by
   */
  group: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),

  /**
   * Start date filter (ISO Format)
   */
  startDate: PropTypes.string,

  /**
   * End date filter (ISO Format)
   */
  endDate: PropTypes.string,

  /**
   * The number of records to fetch
   */
  limit: PropTypes.number,

  /**
   * The number of records to show per page, disables pagination if not specified.
   */
  pageSize: PropTypes.number,

  /**
   * The page to fetch
   */
  page: PropTypes.number,

  /**
   * The group ID to group the leaderboard by (only relevant if type is group)
   */
  groupID: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

  /**
   * The tag ID to group the leaderboard by
   */
  tagId: PropTypes.string,

  /**
   * The tag value to filter by
   */
  tagValue: PropTypes.string,

  /**
   * Override the deserializeLeaderboard method
   */
  deserializeMethod: PropTypes.func,

  /**
   * Props to be passed to the Constructicon Leaderboard component
   */
  leaderboard: PropTypes.object,

  /**
   * Props to be passed to the Constructicon LeaderboardItem component
   */
  leaderboardItem: PropTypes.object,

  /**
   * Props to be passed to the Filter component (false to hide)
   */
  filter: PropTypes.any,

  /**
   * Format page amount as currency?
   */
  currency: PropTypes.bool,

  /**
   * The number format of the page amount
   */
  format: PropTypes.string,

  /**
   * Offset to be applied to each page amount
   */
  offset: PropTypes.number,

  /**
   * The amount to multiply each page amount by for custom conversions
   */
  multiplier: PropTypes.number,

  /**
   * Interval (in milliseconds) to refresh data from API
   */
  refreshInterval: PropTypes.number,

  /**
   * The field to show as a subtitle
   */
  subtitleMethod: PropTypes.func
}

Leaderboard.defaultProps = {
  currency: true,
  filter: {},
  format: '0,0',
  limit: 10,
  multiplier: 1,
  offset: 0,
  page: 1,
  showPage: false,
  subtitleMethod: item => item.subtitle
}

export default Leaderboard
