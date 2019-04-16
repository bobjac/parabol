import DataLoader from 'dataloader'
import {decode} from 'jsonwebtoken'
import getRethink from 'server/database/rethinkDriver'
import AtlassianManager from 'server/utils/AtlassianManager'
import {getUserId} from 'server/utils/authorization'
import sendToSentry from 'server/utils/sendToSentry'
import {IAuthToken} from 'universal/types/graphql'
import promiseAllPartial from 'universal/utils/promiseAllPartial'

interface JiraRemoteProjectKey {
  accessToken: string
  cloudId: string
  atlassianProjectId: string
}

const defaultCacheKeyFn = (key) => key

const indexResults = (results, indexField, cacheKeyFn = defaultCacheKeyFn) => {
  const indexedResults = new Map()
  results.forEach((res) => {
    indexedResults.set(cacheKeyFn(res[indexField]), res)
  })
  return indexedResults
}

const normalizeRethinkDbResults = (keys, indexField, cacheKeyFn = defaultCacheKeyFn) => (
  results,
  authToken,
  table
) => {
  const indexedResults = indexResults(results, indexField, cacheKeyFn)
  // return keys.map((val) => indexedResults.get(cacheKeyFn(val)) || new Error(`Key not found : ${val}`));
  return keys.map((val) => {
    const res = indexedResults.get(cacheKeyFn(val))
    if (!res) {
      const viewerId = getUserId(authToken)
      sendToSentry(new Error(`dataloader not found for ${cacheKeyFn(val)}, on ${table}`), {
        userId: viewerId
      })
      return null
    }
    return res
  })
}

export default class RethinkDataLoader {
  dataLoaderOptions: DataLoader.Options<any, any>
  authToken: null | IAuthToken

  constructor (authToken, dataLoaderOptions = {}) {
    this.authToken = authToken
    this.dataLoaderOptions = dataLoaderOptions
  }

  _share () {
    this.authToken = null
  }

  fkLoader (
    standardLoader: DataLoader<any, any>,
    field: string,
    fetchFn: (ids: string[]) => any[] | Promise<any[]>
  ) {
    const batchFn = async (ids) => {
      const items = await fetchFn(ids)
      items.forEach((item) => {
        standardLoader.clear(item.id).prime(item.id, item)
      })
      return ids.map((id) => items.filter((item) => item[field] === id))
    }
    return new DataLoader(batchFn, this.dataLoaderOptions)
  }

  pkLoader (table: string) {
    // don't pass in a a filter here because they requested a specific ID, they know what they want
    const batchFn = async (keys) => {
      const r = getRethink()
      const docs = await r.table(table).getAll(r.args(keys), {index: 'id'})
      return normalizeRethinkDbResults(keys, 'id')(docs, this.authToken, table)
    }
    return new DataLoader(batchFn, this.dataLoaderOptions)
  }

  customLoader (batchFn: (ids: string[]) => Promise<any[]>) {
    return new DataLoader(batchFn, this.dataLoaderOptions)
  }

  agendaItems = this.pkLoader('AgendaItem')
  atlassianAuths = this.pkLoader('AtlassianAuth')
  atlassianProjects = this.pkLoader('AtlassianProject')
  customPhaseItems = this.pkLoader('CustomPhaseItem')
  meetings = this.pkLoader('Meeting')
  meetingSettings = this.pkLoader('MeetingSettings')
  meetingMembers = this.pkLoader('MeetingMember')
  newMeetings = this.pkLoader('NewMeeting')
  newFeatures = this.pkLoader('NewFeature')
  notifications = this.pkLoader('Notification')
  organizations = this.pkLoader('Organization')
  organizationUsers = this.pkLoader('OrganizationUser')
  reflectTemplates = this.pkLoader('ReflectTemplate')
  retroReflectionGroups = this.pkLoader('RetroReflectionGroup')
  retroReflections = this.pkLoader('RetroReflection')
  softTeamMembers = this.pkLoader('SoftTeamMember')
  suggestedActions = this.pkLoader('SuggestedAction')
  tasks = this.pkLoader('Task')
  teamMembers = this.pkLoader('TeamMember')
  teamInvitations = this.pkLoader('TeamInvitation')
  teams = this.pkLoader('Team')
  users = this.pkLoader('User')

  agendaItemsByTeamId = this.fkLoader(this.agendaItems, 'teamId', (teamIds) => {
    const r = getRethink()
    return r
      .table('AgendaItem')
      .getAll(r.args(teamIds), {index: 'teamId'})
      .filter({isActive: true})
  })

  atlassianAuthByUserId = this.fkLoader(this.atlassianAuths, 'userId', (userIds) => {
    const r = getRethink()
    return r.table('AtlassianAuth').getAll(r.args(userIds), {index: 'userId'})
  })

  atlassianProjectsByTeamId = this.fkLoader(this.atlassianProjects, 'teamId', (teamIds) => {
    const r = getRethink()
    return r
      .table('AtlassianProject')
      .getAll(r.args(teamIds), {index: 'teamId'})
      .filter({isActive: true})
  })

  customPhaseItemsByTeamId = this.fkLoader(this.customPhaseItems, 'teamId', (teamIds) => {
    const r = getRethink()
    return r
      .table('CustomPhaseItem')
      .getAll(r.args(teamIds), {index: 'teamId'})
      .filter({isActive: true})
  })

  meetingMembersByMeetingId = this.fkLoader(this.meetingMembers, 'meetingId', (meetingIds) => {
    const r = getRethink()
    return r.table('MeetingMember').getAll(r.args(meetingIds), {index: 'meetingId'})
  })

  meetingSettingsByTeamId = this.fkLoader(this.meetingSettings, 'teamId', (teamIds) => {
    const r = getRethink()
    return r.table('MeetingSettings').getAll(r.args(teamIds), {index: 'teamId'})
  })

  organizationUsersByOrgId = this.fkLoader(this.organizationUsers, 'orgId', (orgIds) => {
    const r = getRethink()
    return r
      .table('OrganizationUser')
      .getAll(r.args(orgIds), {index: 'orgId'})
      .filter({removedAt: null})
  })

  organizationUsersByUserId = this.fkLoader(this.organizationUsers, 'userId', (userIds) => {
    const r = getRethink()
    return r
      .table('OrganizationUser')
      .getAll(r.args(userIds), {index: 'userId'})
      .filter({removedAt: null})
  })

  retroReflectionGroupsByMeetingId = this.fkLoader(
    this.retroReflectionGroups,
    'meetingId',
    (meetingIds) => {
      const r = getRethink()
      return r
        .table('RetroReflectionGroup')
        .getAll(r.args(meetingIds), {index: 'meetingId'})
        .filter({isActive: true})
    }
  )

  reflectTemplatesByTeamId = this.fkLoader(this.reflectTemplates, 'teamId', (teamIds) => {
    const r = getRethink()
    return r
      .table('ReflectTemplate')
      .getAll(r.args(teamIds), {index: 'teamId'})
      .filter({isActive: true})
  })

  retroReflectionsByMeetingId = this.fkLoader(this.retroReflections, 'meetingId', (meetingIds) => {
    const r = getRethink()
    return r
      .table('RetroReflection')
      .getAll(r.args(meetingIds), {index: 'meetingId'})
      .filter({isActive: true})
  })

  softTeamMembersByTeamId = this.fkLoader(this.softTeamMembers, 'teamId', (teamIds) => {
    const r = getRethink()
    return r
      .table('SoftTeamMember')
      .getAll(r.args(teamIds), {index: 'teamId'})
      .filter({isActive: true})
  })

  suggestedActionsByUserId = this.fkLoader(this.suggestedActions, 'userId', (userIds) => {
    const r = getRethink()
    return r
      .table('SuggestedAction')
      .getAll(r.args(userIds), {index: 'userId'})
      .filter({removedAt: null})
  })

  tasksByTeamId = this.fkLoader(this.tasks, 'teamId', (teamIds) => {
    const r = getRethink()
    const userId = getUserId(this.authToken)
    return r
      .table('Task')
      .getAll(r.args(teamIds), {index: 'teamId'})
      .filter((task) =>
        task('tags')
          .contains('private')
          .and(task('userId').ne(userId))
          .or(task('tags').contains('archived'))
          .not()
      )
  })

  tasksByUserId = this.fkLoader(this.tasks, 'userId', (_userIds) => {
    const r = getRethink()
    const userId = getUserId(this.authToken)
    const tms = (this.authToken && this.authToken.tms) || []
    return r
      .table('Task')
      .getAll(userId, {index: 'userId'})
      .filter((task) =>
        r.and(
          task('tags')
            .contains('archived')
            .not(),
          // weed out the tasks on archived teams
          r(tms).contains(task('teamId'))
        )
      )
  })

  teamsByOrgId = this.fkLoader(this.teams, 'orgId', (orgIds) => {
    const r = getRethink()
    return r
      .table('Team')
      .getAll(r.args(orgIds), {index: 'orgId'})
      .filter((team) =>
        team('isArchived')
          .default(false)
          .ne(true)
      )
  })

  teamInvitationsByTeamId = this.fkLoader(this.teamInvitations, 'teamId', (teamIds) => {
    const r = getRethink()
    const now = new Date()
    return r
      .table('TeamInvitation')
      .getAll(r.args(teamIds), {index: 'teamId'})
      .filter({acceptedAt: null})
      .filter((row) => row('expiresAt').ge(now))
  })

  teamMembersByTeamId = this.fkLoader(this.teamMembers, 'teamId', (teamIds) => {
    const r = getRethink()
    return r
      .table('TeamMember')
      .getAll(r.args(teamIds), {index: 'teamId'})
      .filter({isNotRemoved: true})
  })

  freshAtlassianAccessToken = new DataLoader(
    async (keys: {userId: string; teamId: string}[]) => {
      return promiseAllPartial(
        keys.map(async ({userId, teamId}) => {
          const userAuths = await this.atlassianAuthByUserId.load(userId)
          const teamAuth = userAuths.find((auth) => auth.teamId === teamId)
          if (!teamAuth || !teamAuth.refreshToken) return null
          const {accessToken: existingAccessToken, refreshToken} = teamAuth
          const decodedToken = decode(existingAccessToken) as IAuthToken
          const now = new Date()
          if (decodedToken && decodedToken.exp >= Math.floor(now.getTime() / 1000)) {
            return existingAccessToken
          }
          // fetch a new one
          const manager = await AtlassianManager.refresh(refreshToken)
          const {accessToken} = manager
          const r = getRethink()
          await r.table('AtlassianAuth').update({accessToken, updatedAt: now})
          return accessToken
        })
      )
    },
    {
      ...this.dataLoaderOptions,
      cacheKeyFn: (key: {teamId: string; userId: string}) => `${key.userId}:${key.teamId}`
    }
  )

  jiraRemoteProject = new DataLoader(
    async (keys: JiraRemoteProjectKey[]) => {
      return promiseAllPartial(
        keys.map(async ({accessToken, cloudId, atlassianProjectId}) => {
          const manager = new AtlassianManager(accessToken)
          return manager.getProject(cloudId, atlassianProjectId)
        })
      )
    },
    {
      ...this.dataLoaderOptions,
      cacheKeyFn: (key: JiraRemoteProjectKey) => `${key.atlassianProjectId}:${key.cloudId}`
    }
  )
}
