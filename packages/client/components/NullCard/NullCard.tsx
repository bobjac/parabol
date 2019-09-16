import React from 'react'
import CreateCardRootStyles from '../CreateCard/CreateCardRootStyles'
import styled from '@emotion/styled'
import {PALETTE} from '../../styles/paletteV2'
import {Card} from '../../types/constEnums'
import Ellipsis from '../Ellipsis/Ellipsis'

const CardBlock = styled('div')({
  ...CreateCardRootStyles,
  border: 0
})

const AddingHint = styled('div')({
  color: PALETTE.TEXT_GRAY,
  fontSize: Card.FONT_SIZE,
  textAlign: 'center'
})

interface Props {
  preferredName: string
}

const NullCard = (props: Props) => {
  const {preferredName} = props
  return (
    <CardBlock>
      <AddingHint>
        {preferredName}
        {' is adding a Task'}
        <Ellipsis />
      </AddingHint>
    </CardBlock>
  )
}

export default NullCard
