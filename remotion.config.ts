import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(4);
Config.setPixelFormat("yuv420p");
Config.setCodec("h264");
Config.setCrf(20);
Config.setOverwriteOutput(true);
Config.setEntryPoint("remotion/index.ts");
