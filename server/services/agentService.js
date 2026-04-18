import { randomUUID } from "node:crypto";
import {
	getAgentById,
	insertAgent,
	listAgents,
	updateAgent,
} from "../repositories/agentsRepository.js";
import { getProjectById } from "../repositories/projectsRepository.js";

export function getAgents() {
	return listAgents();
}

export function createAgentRecord(input) {
	if (!getProjectById(input.projectId)) {
		return null;
	}

	const agent = {
		id: randomUUID(),
		name: input.name.trim() || "Nouvel agent",
		role: input.role.trim() || "Worker local",
		status: input.status,
		currentTask: input.currentTask.trim() || "Aucune tâche définie",
		projectId: input.projectId,
		runtime: "local",
		updatedAt: new Date().toISOString(),
	};

	insertAgent(agent);
	return getAgentById(agent.id);
}

export function patchAgent(agentId, changes) {
	if (changes.projectId && !getProjectById(changes.projectId)) {
		return null;
	}

	return updateAgent(agentId, changes);
}
