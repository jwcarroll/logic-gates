import { Canvas } from './components/Canvas'
import { useGroupView } from '../app/hooks/useGroupView'

export function WorkspaceCanvas() {
  const groupView = useGroupView()
  return <Canvas viewGroupId={groupView.groupId} onOpenGroup={groupView.openGroup} />
}
