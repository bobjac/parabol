import styled from '@emotion/styled'
import graphql from 'babel-plugin-relay/macro'
import React from 'react'
import {createFragmentContainer} from 'react-relay'
import SettingsWrapper from '../../../../components/Settings/SettingsWrapper'
import {ProviderList_viewer} from '../../../../__generated__/ProviderList_viewer.graphql'
import AtlassianProviderRow from '../ProviderRow/AtlassianProviderRow'
import GitHubProviderRow from '../ProviderRow/GitHubProviderRow'
import GitLabProviderRow from '../ProviderRow/GitLabProviderRow'
import MattermostProviderRow from '../ProviderRow/MattermostProviderRow'
import SlackProviderRow from '../ProviderRow/SlackProviderRow'
import ADOProviderRow from '../ProviderRow/ADOProviderRow'

interface Props {
  viewer: ProviderList_viewer
  teamId: string
  retry: () => void
}

const StyledWrapper = styled(SettingsWrapper)({
  display: 'block'
})

const ProviderList = (props: Props) => {
  const {viewer, retry, teamId} = props
  const {
    featureFlags: {gitlab: allowGitlab}
  } = viewer
  return (
    <StyledWrapper>
      <AtlassianProviderRow teamId={teamId} retry={retry} viewer={viewer} />
      <GitHubProviderRow teamId={teamId} viewer={viewer} />
      {allowGitlab && <GitLabProviderRow teamId={teamId} viewerRef={viewer} />}
      <MattermostProviderRow teamId={teamId} viewerRef={viewer} />
      <SlackProviderRow teamId={teamId} viewer={viewer} />
      <ADOProviderRow teamId={teamId} viewer={viewer} />
    </StyledWrapper>
  )
}

export default createFragmentContainer(ProviderList, {
  viewer: graphql`
    fragment ProviderList_viewer on User {
      ...AtlassianProviderRow_viewer
      ...GitHubProviderRow_viewer
      ...GitLabProviderRow_viewer
      ...MattermostProviderRow_viewer
      ...SlackProviderRow_viewer
      ...ADOProviderRow_viewer

      featureFlags {
        gitlab
      }
    }
  `
})
