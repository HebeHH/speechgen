import { create } from "domain";
import { script } from "./8kmeditationapp/meditationText";
import { getVoiceFiles, meditationappfolder } from "./8kmeditationapp/voicedMeditation";
import { createVoiceExamples } from "./examples/voiceExampleCreation";

async function main() {
    await createVoiceExamples();
}
main()