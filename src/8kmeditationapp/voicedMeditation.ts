import path from "path";
import { batchProcess } from "../tts/cartesia";
import type { Script, VoicedStatement } from "../types/script";
import fs from 'fs';

export const meditationappfolder = "/Users/hebe/Dropbox/Code/my_ai/ai_stuff/speechgen/data/8kmeditationapp"

export async function getVoiceFiles(statements: Script, baseFolder: string) {

    const voiced: VoicedStatement[] = statements.map((statement, index) => {
        return {
            ...statement,
            filename: `${index}.mp3`
        };
    });

    await batchProcess("42b39f37-515f-4eee-8546-73e841679c1d", voiced, path.join(baseFolder, 'statements'));

    const padFileText = voiced.map(statement => `ffmpeg -i statements/${statement.filename}  -af "apad=pad_dur=${statement.pauseAfter || 1}" -y statements/padded_${statement.filename}`)
    const concatFileText = voiced.map(statement => `file 'statements/padded_${statement.filename}'`)

    padFileText.push(`ffmpeg -f concat -safe 0 -i inputs.txt  -c copy final_output.wav`)

    fs.writeFileSync(path.join(baseFolder, 'main.sh'), padFileText.join('\n'));

    fs.writeFileSync(path.join(baseFolder, 'inputs.txt'), concatFileText.join('\n'));
}