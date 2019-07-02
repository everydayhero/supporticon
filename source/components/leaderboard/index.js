import React, { Component } from 'react'
import orderBy from 'lodash/orderBy'
import PropTypes from 'prop-types'
import numbro from 'numbro'

import Filter from 'constructicon/filter'
import Grid from 'constructicon/grid'
import LeaderboardItem from 'constructicon/leaderboard-item'
import LeaderboardWrapper from 'constructicon/leaderboard'
import Pagination from 'constructicon/pagination'
import PaginationLink from 'constructicon/pagination-link'

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
      return excluded.indexOf(item.group.value.toString()) === -1
    })
  }

  handleData (data, excludeOffline) {
    const leaderboardData = data.map(deserializeLeaderboard)

    if (excludeOffline) {
      return orderBy(
        leaderboardData.map(item => ({
          ...item,
          raised: item.raised - item.offline
        })),
        ['raised'],
        ['desc']
      ).map((item, index) => ({
        ...item,
        position: index + 1
      }))
    }

    return leaderboardData
  }

  fetchLeaderboard (q, refresh) {
    const {
      campaign,
      charity,
      country,
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
      type
    } = this.props

    !refresh &&
      this.setState({
        status: 'fetching',
        data: undefined
      })

    fetchLeaderboard({
      campaign,
      charity,
      country,
      endDate,
      event,
      excludePageIds: type === 'group' ? undefined : excludePageIds,
      group,
      groupID,
      limit,
      maxAmount,
      minAmount,
      page,
      pageIds,
      q,
      startDate,
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
          data: this.handleData(data, excludeOffline)
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
    const { leaderboard, filter, pageSize } = this.props

    return (
      <div>
        {filter && <Filter onChange={this.setFilter} {...filter} />}
        <LeaderboardWrapper
          loading={status === 'fetching'}
          error={status === 'failed'}
          {...leaderboard}
        >
          {data.length && (
            <Pagination max={pageSize} toPaginate={data}>
              {({ currentPage, isPaginated, prev, next, canPrev, canNext }) => (
                <div>
                  {currentPage.map(this.renderLeader)}
                  {pageSize &&
                    isPaginated && (
                    <Grid justify='center'>
                      <PaginationLink
                        onClick={prev}
                        direction='prev'
                        disabled={!canPrev}
                      />
                      <PaginationLink
                        onClick={next}
                        direction='next'
                        disabled={!canNext}
                      />
                    </Grid>
                  )}
                </div>
              )}
            </Pagination>
          )}
        </LeaderboardWrapper>
      </div>
    )
  }

  renderLeader (leader, i) {
    const { leaderboardItem = {} } = this.props

    return (
      <LeaderboardItem
        key={i}
        title={leader.name}
        subtitle={leader.subtitle}
        image={leader.image}
        amount={numbro(leader.raised).formatCurrency('0,0')}
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
   * Interval (in milliseconds) to refresh data from API
   */
  refreshInterval: PropTypes.number
}

Leaderboard.defaultProps = {
  limit: 10,
  page: 1,
  filter: {}
}

export default Leaderboard
