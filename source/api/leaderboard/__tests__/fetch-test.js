import moxios from 'moxios'
import { instance, servicesAPI, updateClient } from '../../../utils/client'
import { fetchLeaderboard } from '..'
import { fetchLeaderboard as fetchJGLeaderboard } from '../justgiving'
import { fetchLeaderboard as fetchEDHLeaderboard } from '../everydayhero'

describe('Fetch Leaderboards', () => {
  it('throws if no params are passed in', () => {
    const test = () => fetchLeaderboard()
    expect(test).to.throw
  })

  describe('Fetch EDH Leaderboards', () => {
    beforeEach(() => {
      moxios.install(instance)
    })

    afterEach(() => {
      moxios.uninstall(instance)
    })

    it('uses the correct url to fetch a leaderboard', done => {
      fetchEDHLeaderboard({ campaign_id: 'au-6839', group_value: 'group123' })
      moxios.wait(() => {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.contain(
          'https://everydayhero.com/api/v2/search/pages_total'
        )
        expect(request.url).to.contain('campaign_id=au-6839')
        expect(request.url).to.contain('group_value=group123')
        done()
      })
    })

    it('throws if no params are passed in', () => {
      const test = () => fetchEDHLeaderboard()
      expect(test).to.throw
    })

    it('uses the correct url to fetch a campaign leaderboard', done => {
      fetchEDHLeaderboard({ campaign: 'au-6839' })
      moxios.wait(function () {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.contain(
          'https://everydayhero.com/api/v2/search/pages_total'
        )
        expect(request.url).to.contain('campaign_id=au-6839')
        done()
      })
    })

    it('uses the correct url to fetch a leaderboard for multiple campaigns', done => {
      fetchEDHLeaderboard({ campaign: ['au-6839', 'au-6840'] })
      moxios.wait(function () {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.contain(
          'https://everydayhero.com/api/v2/search/pages_total'
        )
        expect(request.url).to.contain('campaign_id[]=au-6839')
        expect(request.url).to.contain('campaign_id[]=au-6840')
        done()
      })
    })

    it('uses the correct url to fetch a charity leaderboard', done => {
      fetchEDHLeaderboard({ charity: 'au-28' })
      moxios.wait(function () {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.contain(
          'https://everydayhero.com/api/v2/search/pages_total'
        )
        expect(request.url).to.contain('charity_id=au-28')
        done()
      })
    })

    it('uses the correct url to fetch a leaderboard for multiple campaigns', done => {
      fetchEDHLeaderboard({ charity: ['au-28', 'au-29'] })
      moxios.wait(function () {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.contain(
          'https://everydayhero.com/api/v2/search/pages_total'
        )
        expect(request.url).to.contain('charity_id[]=au-28')
        expect(request.url).to.contain('charity_id[]=au-29')
        done()
      })
    })

    it('correctly transforms page type params', done => {
      fetchEDHLeaderboard({ type: 'team' })
      moxios.wait(function () {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.contain(
          'https://everydayhero.com/api/v2/search/pages_total'
        )
        expect(request.url).to.contain('group_by=teams')
        done()
      })
    })

    it('fetches leaderboards based on a group', done => {
      fetchEDHLeaderboard({ type: 'group', groupID: 99 })
      moxios.wait(function () {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.contain(
          'https://everydayhero.com/api/v2/search/pages_total'
        )
        expect(request.url).to.contain('group_by=groups')
        expect(request.url).to.contain('group_id=99')
        done()
      })
    })
  })

  describe('Fetch JG Leaderboards', () => {
    beforeEach(() => {
      updateClient({
        baseURL: 'https://api.justgiving.com',
        headers: { 'x-api-key': 'abcd1234' }
      })
      moxios.install(instance)
      moxios.install(servicesAPI)
    })

    afterEach(() => {
      updateClient({ baseURL: 'https://everydayhero.com' })
      moxios.uninstall(instance)
      moxios.uninstall(servicesAPI)
    })

    it('throws if no params are passed in', () => {
      const test = () => fetchJGLeaderboard()
      expect(test).to.throw
    })

    it('uses the correct url to fetch a campaign leaderboard', done => {
      fetchJGLeaderboard({ campaign: '1234' })
      moxios.wait(() => {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.contain(
          'https://api.justgiving.com/donationsleaderboards/v1/leaderboard?campaignGuids=1234'
        )
        done()
      })
    })

    it('uses the correct url to fetch a team leaderboard', done => {
      fetchJGLeaderboard({ campaign: '1234', type: 'team' })
      moxios.wait(() => {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.contain(
          'https://api.justgiving.com/donationsleaderboards/v1/leaderboard?campaignGuids=1234&groupBy=TeamGuid'
        )
        done()
      })
    })

    it('uses the correct url to fetch a campaign leaderboard with all pages', done => {
      fetchJGLeaderboard({ campaign: 'my-campaign', allPages: true })
      moxios.wait(() => {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.contain(
          'https://api.blackbaud.services/v1/justgiving/campaigns/my-campaign/pages'
        )
        done()
      })
    })

    it('uses the correct url to fetch an event leaderboard', done => {
      fetchJGLeaderboard({ event: 12345 })
      moxios.wait(function () {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.equal(
          'https://api.justgiving.com/v1/events/leaderboard?eventid=12345&currency=GBP'
        )
        done()
      })
    })

    it('allows ther country (and currency) to be set', done => {
      fetchJGLeaderboard({ event: 12345, country: 'au' })
      moxios.wait(function () {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.equal(
          'https://api.justgiving.com/v1/events/leaderboard?eventid=12345&currency=AUD'
        )
        done()
      })
    })

    it('fetches pages for multiple events', done => {
      fetchJGLeaderboard({ event: [12345, 54321] })
      moxios.wait(function () {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.equal(
          'https://api.justgiving.com/v1/events/leaderboard?eventid=12345&eventid=54321&currency=GBP'
        )
        done()
      })
    })

    it('allows you to specify the number of pages to return', done => {
      fetchJGLeaderboard({ event: 12345, limit: 50 })
      moxios.wait(function () {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.equal(
          'https://api.justgiving.com/v1/events/leaderboard?eventid=12345&currency=GBP&maxResults=50'
        )
        done()
      })
    })

    it('throws if incorrect params are passed in for an event leaderboard', () => {
      const test = () => fetchJGLeaderboard({ event: 'my-event' })
      expect(test).to.throw
    })

    it('uses the correct url to fetch a charity leaderboard', done => {
      fetchJGLeaderboard({ charity: 4567 })
      moxios.wait(function () {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.include(
          'https://api.justgiving.com/donationsleaderboards/v1/leaderboard?charityIds=4567'
        )
        done()
      })
    })

    it('throws if incorrect params are passed in for a charity leaderboard', () => {
      const test = () => fetchJGLeaderboard({ charity: 'my-charity' })
      expect(test).to.throw
    })
  })
})
