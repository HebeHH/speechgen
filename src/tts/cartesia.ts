import { CartesiaClient, CartesiaError } from "@cartesia/cartesia-js";
import { promises as fs } from "fs";
import path from "path"; // Import the path module
import type { VoicedStatement } from "../types/script";
import cliProgress from 'cli-progress'; // Import cli-progress


type CartesiaSpeed = "slowest" | "slow" | "normal" | "fast" | "fastest";
type CartesiaEmotion = "anger:lowest" | "anger:low" | "anger:high" | "anger:highest" | "positivity:lowest" | "positivity:low" | "positivity:high" | "positivity:highest" | "surprise:lowest" | "surprise:high" | "surprise:highest" | "sadness:lowest" | "sadness:low" | "curiosity:low" | "curiosity:high" | "curiosity:highest";
type CartesiaControls = {
    speed: CartesiaSpeed;
    emotion: CartesiaEmotion[];
} | undefined;

const apiKey = process.env.CARTESIA_API_KEY;

let cartesiaClient: CartesiaClient | null = null;

function getCartesiaClient(): CartesiaClient {
    if (!apiKey) {
        throw new Error("Missing Cartesia API key. Please set the CARTESIA_API_KEY environment variable.");
    }

    if (!cartesiaClient) {
        cartesiaClient = new CartesiaClient({ apiKey });
    }

    return cartesiaClient;
}


// Generate speech from a transcript and save it to a file

async function generateSpeech(transcript: string, voiceId: string, outputFilePath: string, controls: CartesiaControls = undefined): Promise<void> {
    const client = getCartesiaClient();

    try {
        const response = await client.tts.bytes({
            modelId: "sonic",
            voice: {
                mode: "id", id: voiceId,
                experimentalControls: controls
            },
            language: "en",
            transcript,
            outputFormat: { container: "wav", sampleRate: 44100, encoding: "pcm_f32le" },
        });

        await fs.writeFile(outputFilePath, new Uint8Array(response));
    } catch (err) {
        if (err instanceof CartesiaError) {
            console.error(`Error generating speech: ${err.message}`);
        } else {
            console.error(err);
        }
        throw err; // Re-throw the error
    }
}


async function batchProcess(voiceId: string, transcripts: VoicedStatement[], folder?: string, controls: CartesiaControls = undefined): Promise<void> {
    if (folder) {
        try {
            await fs.mkdir(folder, { recursive: true });
        } catch (err) {
            console.error(`Error creating output folder: ${err}`);
            throw err;
        }
    }

    const totalTranscripts = transcripts.length;

    // Create a new progress bar instance
    const progressBar = new cliProgress.SingleBar({
        format: 'Processing [{bar}] {percentage}% | ETA: {eta}s | {value}/{total} transcripts',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
    });

    progressBar.start(totalTranscripts, 0); // Start the progress bar

    let processedCount = 0;
    const promises: Promise<void>[] = [];

    for (const { text, filename: relativePath } of transcripts) {
        const outputFilePath = folder ? path.join(folder, relativePath) : relativePath;

        const promise = generateSpeech(text, voiceId, outputFilePath, controls)
            .then(() => {
                processedCount++;
                progressBar.update(processedCount); // Update the progress bar
            })
            .catch((err) => {
                console.error(`Error processing ${text}:`, err);
                processedCount++;
                progressBar.update(processedCount); // still update the progress bar even if error
            });
        promises.push(promise);

        if (promises.length >= 10) {
            await Promise.all(promises.splice(0, 10));
        }
    }

    await Promise.all(promises);
    progressBar.stop(); // Stop the progress bar

    console.log("Batch processing complete.");
}

export { generateSpeech, batchProcess };