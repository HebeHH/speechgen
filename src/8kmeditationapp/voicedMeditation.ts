import path from "path";
import { batchProcess } from "../tts/cartesia";
import type { Script, VoicedStatement } from "../types/script";
import fs from 'fs';
import concatenateAudioFiles from "../filemanipulation/concat";
import mixAudioFiles from "../filemanipulation/mixAudio";
import ffmpeg from 'fluent-ffmpeg';

export const meditationappfolder = "/Users/hebe/Dropbox/Code/my_ai/ai_stuff/speechgen/data/8kmeditationapp"

export async function getVoiceFiles(statements: Script, baseFolder: string) {

    const voiced: VoicedStatement[] = statements.map((statement, index) => {
        return {
            ...statement,
            filename: `${index}.mp3`
        };
    });

    const movieManId = "c45bc5ec-dc68-4feb-8829-6e6b2748095d"
    const readingLadyId = "15a9cd88-84b0-4a8b-95f2-5d583b54c72e"
    const someGuy = "50d6beb4-80ea-4802-8387-6c948fe84208"

    await batchProcess(readingLadyId, voiced, path.join(baseFolder, 'statements'));
    // First pad each audio file with silence
    const paddedFiles = await Promise.all(voiced.map(async statement => {
        const inputPath = path.join(baseFolder, 'statements', statement.filename);
        const outputPath = path.join(baseFolder, 'statements', `padded_${statement.filename}`);
        
        return new Promise<string>((resolve, reject) => {
            ffmpeg()
                .input(inputPath)
                .audioFilters(`apad=pad_dur=${statement.pauseAfter || 1}`)
                .save(outputPath)
                .on('end', () => resolve(outputPath))
                .on('error', reject);
        });
    }));

    // Concatenate all the padded files
    const concatOutput = path.join(baseFolder, 'final_output.wav');
    await concatenateAudioFiles(paddedFiles, {
        outputPath: concatOutput,
        tempDir: path.join(baseFolder, 'temp')
    });

    // Mix with background audio
    const finalOutput = path.join(baseFolder, `meditation_${new Date().toLocaleTimeString()}.wav`);
    await mixAudioFiles([
        { filename: concatOutput, loudness: 100 },
        { filename: path.join(baseFolder, 'stillwaters.wav'), loudness: 20 }
    ], {
        outputPath: finalOutput
    });
}