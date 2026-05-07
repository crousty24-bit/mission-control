import type { MissionControlDataSource } from "./dataSource";
import { httpDataSource } from "./missionControlApi";
import { isStaticDemoRuntime } from "./runtimeMode";
import { staticDataSource } from "./staticDataSource";
import { tauriDataSource } from "./tauriDataSource";
import { isTauriRuntime } from "./tauriRuntime";

export function createMissionControlDataSource(): MissionControlDataSource {
	if (isStaticDemoRuntime()) {
		return staticDataSource;
	}

	return isTauriRuntime() ? tauriDataSource : httpDataSource;
}
