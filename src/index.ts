import { create } from "domain";
import { script } from "./8kmeditationapp/meditationText";
import { getVoiceFiles, meditationappfolder } from "./8kmeditationapp/voicedMeditation";
import { createVoiceExamples } from "./examples/voiceExampleCreation";
import concatenateAudioFiles from "./filemanipulation/concat";

async function main() {
    const exs = await createVoiceExamples();
    concatenateAudioFiles(exs, { outputPath: meditationappfolder, showProgress: true });
}
main()