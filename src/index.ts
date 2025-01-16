import { script } from "./8kmeditationapp/meditationText";
import { getVoiceFiles, meditationappfolder } from "./8kmeditationapp/voicedMeditation";

async function main() {
    getVoiceFiles(script, meditationappfolder)
}
main()