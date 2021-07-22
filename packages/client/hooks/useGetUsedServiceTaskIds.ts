import graphql from 'babel-plugin-relay/macro'
import {useMemo} from 'react'
import {readInlineData} from 'react-relay'
import {useGetUsedServiceTaskIds_phase} from '../__generated__/useGetUsedServiceTaskIds_phase.graphql'

const useGetUsedServiceTaskIds = (phaseRef: any) => {
  return useMemo(() => {
    const estimatePhase = readInlineData<useGetUsedServiceTaskIds_phase>(
      graphql`
        fragment useGetUsedServiceTaskIds_phase on EstimatePhase @inline {
          stages {
            serviceTaskId
            story {
              ... on Task {
                __typename
                integrationHash
              }
            }
          }
        }
      `,
      phaseRef
    )
    const {stages} = estimatePhase
    const usedServiceTaskIds = new Set<string>()
    stages.forEach((stage) => {
      const {serviceTaskId, story} = stage
      usedServiceTaskIds.add(serviceTaskId)
      if (story?.__typename === 'Task') {
        const {integrationHash} = story
        if (integrationHash) {
          usedServiceTaskIds.add(integrationHash)
        }
      }
    })
    return usedServiceTaskIds
  }, [phaseRef])
}

export default useGetUsedServiceTaskIds
