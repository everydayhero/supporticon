import { get, put } from '../../../utils/client'
import { required } from '../../../utils/params'

export const deserializeTeam = (team) => ({
  id: team.id,
  leader: null,
  name: team.name,
  pages: team.teamMembers,
  raised: team.raisedSoFar,
  slug: team.teamShortName
})

export const fetchTeams = () => {
  return Promise.reject(new Error('This method is not supported for JustGiving'))
}

export const fetchTeam = (id = required()) => {
  return get(`v1/team/${id}`)
}

export const createTeam = ({
  name = required(),
  slug = required(),
  story = required(),
  target = required(),
  targetType = 'Fixed',
  teamType = 'Open',
  token = required()
}) => {
  return put('v1/team', {
    name,
    story,
    targetType,
    teamShortName: slug,
    teamTarget: target,
    teamType
  }, {
    headers: {
      'Authorization': `Basic ${token}`
    }
  })
}

export const joinTeam = ({
  id = required(),
  page = required(),
  token = required()
}) => {
  return put(`v1/team/join/${id}`, {
    pageShortName: page
  }, {
    headers: {
      'Authorization': `Basic ${token}`
    }
  })
}
