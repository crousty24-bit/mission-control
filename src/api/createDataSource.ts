import type { MissionControlDataSource } from './dataSource'
import { httpDataSource } from './missionControlApi'
import { tauriDataSource } from './tauriDataSource'
import { isTauriRuntime } from './tauriRuntime'

export function createMissionControlDataSource(): MissionControlDataSource {
  return isTauriRuntime() ? tauriDataSource : httpDataSource
}
