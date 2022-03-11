import styled from '@emotion/styled'
import graphql from 'babel-plugin-relay/macro'
import React from 'react'
// import jwtDecode from 'jwt-decode'
import {createFragmentContainer} from 'react-relay'
import {RouteComponentProps, withRouter} from 'react-router-dom'
import FlatButton from '../../../../components/FlatButton'
import GitHubProviderLogo from '../../../../components/GitHubProviderLogo'
//import GitHubSVG from '../../../../components/GitHubSVG'
import Icon from '../../../../components/Icon'
import ProviderActions from '../../../../components/ProviderActions'
import ProviderCard from '../../../../components/ProviderCard'
import RowInfo from '../../../../components/Row/RowInfo'
import RowInfoCopy from '../../../../components/Row/RowInfoCopy'
import withAtmosphere, {WithAtmosphereProps} from '../../../../decorators/withAtmosphere/withAtmosphere'
import useBreakpoint from '../../../../hooks/useBreakpoint'
// import {MenuPosition} from '../../../../hooks/useCoords'
// import useMenu from '../../../../hooks/useMenu'
import {MenuMutationProps} from '../../../../hooks/useMutationProps'
// import {DECELERATE, fadeIn} from '../../../../styles/animation'
import {PALETTE} from '../../../../styles/paletteV3'
// import {ICON_SIZE} from '../../../../styles/typographyV2'
import {Breakpoint, Providers} from '../../../../types/constEnums'
// import {AuthToken} from '../../../../types/AuthToken'
import AzureDevOpsClientManager from '../../../../utils/AzureDevOpsClientManager'
import withMutationProps, {WithMutationProps} from '../../../../utils/relay/withMutationProps'
import {ADOProviderRow_viewer} from '../../../../__generated__/ADOProviderRow_viewer.graphql'

const StyledButton = styled(FlatButton)({
  borderColor: PALETTE.SLATE_400,
  color: PALETTE.SLATE_700,
  fontSize: 14,
  fontWeight: 600,
  minWidth: 36,
  paddingLeft: 0,
  paddingRight: 0,
  width: '100%'
})

interface Props extends WithAtmosphereProps, WithMutationProps, RouteComponentProps<{}> {
  teamId: string
  viewer: ADOProviderRow_viewer
}

/*
const useFreshToken = (accessToken: string | undefined, retry: () => void) => {
  useEffect(() => {
    if (!accessToken) return
    const decodedToken = jwtDecode(accessToken) as AuthToken | null
    const delay = (decodedToken && decodedToken.exp * 1000 - Date.now()) || -1
    if (delay <= 0) return
    const cancel = window.setTimeout(() => {
      retry()
    }, delay)
    return () => {
      window.clearTimeout(cancel)
    }
  }, [accessToken, retry])
}

const MenuButton = styled(FlatButton)({
  color: PALETTE.GRAPE_700,
  fontSize: ICON_SIZE.MD18,
  height: 24,
  userSelect: 'none',
  marginLeft: 4,
  padding: 0,
  width: 24
})

const StyledIcon = styled(Icon)({
  fontSize: ICON_SIZE.MD18
})

const ListAndMenu = styled('div')({
  display: 'flex',
  position: 'absolute',
  right: 16,
  top: 16
})

const SiteList = styled('div')({})

const SiteAvatar = styled('img')<{idx: number}>(({idx}) => ({
  animationName: fadeIn.toString(),
  animationDuration: '300ms',
  animationFillMode: 'forwards',
  animationTimingFunction: DECELERATE,
  animationDelay: `${idx * 100}ms`,
  animationIterationCount: 1,
  borderRadius: '100%',
  marginLeft: 8,
  opacity: 0
}))
*/

const ProviderName = styled('div')({
  color: PALETTE.SLATE_700,
  fontSize: 16,
  fontWeight: 600,
  lineHeight: '24px',
  alignItems: 'center',
  display: 'flex',
  marginRight: 16,
  verticalAlign: 'middle'
})

const ADOProviderRow = (props: Props) => {
  const {
    atmosphere,
    //   retry,
    //   viewer,
    teamId,
    submitting,
    submitMutation,
    onError,
    onCompleted
  } = props

  // const {togglePortal, originRef, menuPortal, menuProps} = useMenu(MenuPosition.UPPER_RIGHT)
  const mutationProps = {submitting, submitMutation, onError, onCompleted} as MenuMutationProps
  const isDesktop = useBreakpoint(Breakpoint.SIDEBAR_LEFT)

  const openOAuth = () => {
    AzureDevOpsClientManager.openOAuth(atmosphere, teamId, mutationProps)
  }

  return (
    <ProviderCard>
      <GitHubProviderLogo />
      <RowInfo>
        <ProviderName>{Providers.AZUREDEVOPS_NAME}</ProviderName>
        <RowInfoCopy>{Providers.AZUREDEVOPS_DESC}</RowInfoCopy>
      </RowInfo>
      <ProviderActions>
        <StyledButton key='linkAccount' onClick={openOAuth} palette='warm' waiting={submitting}>
          {isDesktop ? 'Connect' : <Icon>add</Icon>}
        </StyledButton>
      </ProviderActions>
    </ProviderCard>
  )
}

graphql`
  fragment ADOProviderRowADOIntegration on ADOIntegration {
    accessToken
    id
  }
`

export default createFragmentContainer(
  withAtmosphere(withMutationProps(withRouter(ADOProviderRow))),
  {
    viewer: graphql`
      fragment ADOProviderRow_viewer on User {
        teamMember(teamId: $teamId) {
          integrations {
            ado {
              ...ADOProviderRowADOIntegration @relay(mask: false)
            }
          }
        }
      }
    `
  }
)
