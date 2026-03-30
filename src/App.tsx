import Box from "@mui/material/Box";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import { SnackbarProvider } from "notistack";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { StatisticsProvider } from "@/contexts/Statistics";
import { GameDirector } from "@/desktop/contexts/GameDirector";
import { SoundProvider } from "@/desktop/contexts/Sound";
import { desktopTheme, mobileTheme } from "@/utils/themes";

import WatchPage from "@/desktop/pages/WatchPage";

import MobileHeader from "@/mobile/components/Header";
import { GameDirector as MobileGameDirector } from "@/mobile/contexts/GameDirector";
import { SoundProvider as MobileSoundProvider } from "@/mobile/contexts/Sound";
import MobileWatchPage from "@/mobile/pages/WatchPage";

import { useDynamicConnector } from "@/contexts/starknet";
import { useDungeon } from "@/dojo/useDungeon";
import { useUIStore } from "@/stores/uiStore";
import { type NetworkConfig, getNetworkConfig } from "@/utils/networkConfig";
import { type ReactNode, useEffect, useState } from "react";
import { isBrowser, isMobile } from "react-device-detect";

/**
 * Viewport width below which the mobile UI is shown.
 * Upstream death-mountain used 1215px which incorrectly tagged 13" laptops.
 * 850px targets phones and small tablets only.
 */
const MOBILE_BREAKPOINT = 850;

function useIsSmallViewport() {
	const [isSmall, setIsSmall] = useState(() => typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT);

	useEffect(() => {
		const handleResize = () => {
			setIsSmall(window.innerWidth < MOBILE_BREAKPOINT);
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

	return isSmall;
}

function DungeonRoute({ children }: { children: ReactNode }) {
	const dungeon = useDungeon();
	const { currentNetworkConfig, setCurrentNetworkConfig } = useDynamicConnector();

	useEffect(() => {
		if (dungeon && dungeon.network !== currentNetworkConfig.chainId) {
			setCurrentNetworkConfig(getNetworkConfig(dungeon.network) as NetworkConfig);
		}
	}, [dungeon]);

	if (!dungeon) {
		return null;
	}

	if (dungeon.network !== currentNetworkConfig.chainId) {
		return null;
	}

	return <>{children}</>;
}

function DesktopAppContent() {
	return (
		<ThemeProvider theme={desktopTheme}>
			<SoundProvider>
				<GameDirector>
					<Box className="main">
						<Routes>
							<Route path="/" element={<Navigate to="/survivor" replace />} />
							<Route
								path="/:dungeonId"
								element={
									<DungeonRoute>
										<WatchPage />
									</DungeonRoute>
								}
							/>
							<Route path="*" element={<Navigate to="/survivor" replace />} />
						</Routes>
					</Box>
				</GameDirector>
			</SoundProvider>
		</ThemeProvider>
	);
}

function MobileAppContent() {
	return (
		<ThemeProvider theme={mobileTheme}>
			<MobileSoundProvider>
				<MobileGameDirector>
					<MobileHeader />
					<Box className="main">
						<Routes>
							<Route path="/" element={<Navigate to="/survivor" replace />} />
							<Route
								path="/:dungeonId"
								element={
									<DungeonRoute>
										<MobileWatchPage />
									</DungeonRoute>
								}
							/>
							<Route path="*" element={<Navigate to="/survivor" replace />} />
						</Routes>
					</Box>
				</MobileGameDirector>
			</MobileSoundProvider>
		</ThemeProvider>
	);
}

function useUrlForceMobile(): boolean {
	const params = new URLSearchParams(window.location.search);
	return params.get("mobile") === "1";
}

function App() {
	const isSmallViewport = useIsSmallViewport();
	const { useMobileClient } = useUIStore();
	const urlForceMobile = useUrlForceMobile();
	const shouldShowMobile = isMobile || isSmallViewport || urlForceMobile || (isBrowser && useMobileClient);

	return (
		<BrowserRouter>
			<StyledEngineProvider injectFirst>
				<SnackbarProvider
					anchorOrigin={{ vertical: "top", horizontal: "center" }}
					preventDuplicate
					autoHideDuration={3000}
				>
					<StatisticsProvider>{shouldShowMobile ? <MobileAppContent /> : <DesktopAppContent />}</StatisticsProvider>
				</SnackbarProvider>
			</StyledEngineProvider>
		</BrowserRouter>
	);
}

export default App;
