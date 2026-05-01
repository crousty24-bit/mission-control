import { useEffect } from "react";
import { useAppData } from "../features/app-data/useAppData";

export function RewardNotification() {
	const { dismissRewardNotification, rewardNotification } = useAppData();

	useEffect(() => {
		if (!rewardNotification) {
			return;
		}

		const timeoutId = window.setTimeout(dismissRewardNotification, 3000);
		return () => window.clearTimeout(timeoutId);
	}, [dismissRewardNotification, rewardNotification]);

	if (!rewardNotification) {
		return null;
	}

	return (
		<div className="reward-notification" role="status" aria-live="polite">
			<p>{rewardNotification.message}</p>
			<button
				type="button"
				className="reward-notification__close"
				aria-label="Fermer la notification"
				onClick={dismissRewardNotification}
			>
				<span aria-hidden="true">x</span>
			</button>
		</div>
	);
}
