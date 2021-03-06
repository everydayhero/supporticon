import moxios from 'moxios'
import { metadataAPI, updateClient } from '../../../utils/client'

import { fetchMetadata } from '..'

describe('Fetching Metadata', () => {
  describe('Fetch EDH Metadata', () => {
    beforeEach(() => {
      updateClient({ baseURL: 'https://everydayhero.com' })
      moxios.install(metadataAPI)
    })

    afterEach(() => {
      moxios.uninstall(metadataAPI)
    })

    it('creates metadata with the provided params', done => {
      fetchMetadata({ id: '123', token: 'token' })

      moxios.wait(() => {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.contain(
          'https://mds-engineering.everydayhero.com'
        )
        expect(request.url).to.contain('token=token')
        expect(request.url).to.contain('type=Page')
        done()
      })
    })

    it('throws if required params are not supplied', () => {
      const test = () => fetchMetadata()
      expect(test).to.throw
    })
  })

  describe('Fetch JG Metadata', () => {
    beforeEach(() => {
      updateClient({
        baseURL: 'https://api.justgiving.com',
        headers: { 'x-api-key': 'abcd1234' }
      })
      moxios.install(metadataAPI)
    })

    afterEach(() => {
      updateClient({ baseURL: 'https://everydayhero.com' })
      moxios.uninstall(metadataAPI)
    })

    it('creates metadata with the provided params', done => {
      fetchMetadata({ app: '123', id: '123', token: '123' })

      moxios.wait(() => {
        const request = moxios.requests.mostRecent()
        expect(request.url).to.contain(
          'https://metadata.blackbaud.services/v1/apps/123/metadata'
        )
        done()
      })
    })

    it('throws if required params are not supplied', () => {
      const test = () => fetchMetadata()
      expect(test).to.throw
    })
  })
})
