import { shallow } from 'zustand/shallow'
import { useAppStore } from '../store'
import { selectGroupView } from '../store/workspaceSelectors'

export const useGroupView = () => {
  const view = useAppStore((s) => selectGroupView(s), shallow)
  const openGroup = useAppStore((s) => s.openGroup)
  const closeGroup = useAppStore((s) => s.closeGroup)

  return {
    ...view,
    openGroup,
    closeGroup,
  }
}

