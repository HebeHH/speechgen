import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import { promisify } from 'util';

interface AudioTrack {
    filename: string;
    loudness: number;
}

interface AudioMixOptions {
    outputPath: string;
}

/**
 * Gets the duration of an audio file using ffprobe
 */
const getDuration = promisify((file: string, cb: (err: Error | null, duration?: number) => void) => {
    ffmpeg.ffprobe(file, (err, metadata) => {
        if (err) return cb(err);
        cb(null, metadata.format.duration);
    });
});

/**
 * Mixes multiple audio files, matching their lengths to the first file and adjusting volumes
 * @param tracks Array of audio tracks with filenames and loudness values
 * @param options Configuration options for the mixing process
 * @returns Promise that resolves with the path to the mixed file
 */
async function mixAudioFiles(
    tracks: AudioTrack[],
    options: AudioMixOptions
): Promise<string> {
    if (tracks.length === 0) {
        throw new Error('No audio tracks provided');
    }

    const { outputPath } = options;

    // Get the duration of the first file - this will be our target duration
    const targetDuration = await getDuration(tracks[0].filename);
    if (!targetDuration) {
        throw new Error('Could not determine duration of first audio file');
    }

    return new Promise((resolve, reject) => {
        const command = ffmpeg();

        // Input all files
        tracks.forEach(track => {
            command.input(track.filename);
        });

        // Create complex filter for processing all tracks in one go
        const filterParts: string[] = [];
        
        // Process each track
        tracks.forEach((track, index) => {
            const volume = track.loudness / 100;
            
            if (index === 0) {
                // First track just needs volume adjustment
                filterParts.push(`[${index}:a]volume=${volume}[a${index}]`);
            } else {
                // Subsequent tracks need looping/trimming and volume adjustment
                filterParts.push(
                    `[${index}:a]aloop=loop=-1:size=0,` +
                    `asetpts=N/SR/TB,` +
                    `atrim=0:${targetDuration},` +
                    `volume=${volume}[a${index}]`
                );
            }
        });

        // Mix all tracks together
        const mixInputs = tracks.map((_, i) => `[a${i}]`).join('');
        filterParts.push(
            `${mixInputs}amix=inputs=${tracks.length}:duration=first:dropout_transition=0[out]`
        );

        // Apply the complex filter
        command
            .complexFilter(filterParts, ['out'])
            .output(outputPath)
            .on('end', () => resolve(outputPath))
            .on('error', (err) => reject(new Error(`FFmpeg error: ${err.message}`)))
            .run();
    });
}

export default mixAudioFiles; 