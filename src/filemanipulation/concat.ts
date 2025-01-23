import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs/promises';
import path from 'path';
import cliProgress from 'cli-progress';
import { promisify } from 'util';

interface AudioConcatOptions {
    outputPath: string;
    showProgress?: boolean;
    tempDir?: string;
}

/**
 * Concatenates multiple audio files into a single file using fluent-ffmpeg
 * @param audioFiles Array of paths to audio files to concatenate
 * @param options Configuration options for the concatenation process
 * @returns Promise that resolves with the path to the concatenated file
 */
async function concatenateAudioFiles(
    audioFiles: string[],
    options: AudioConcatOptions
): Promise<string> {
    if (audioFiles.length === 0) {
        throw new Error('No audio files provided');
    }

    const {
        outputPath,
        showProgress = true,
        tempDir = path.join(process.cwd(), 'temp')
    } = options;

    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    // Create concat file
    const concatFilePath = path.join(tempDir, 'concat.txt');
    const concatContent = audioFiles
        .map(file => `file '${path.resolve(file)}'`)
        .join('\n');
    await fs.writeFile(concatFilePath, concatContent);

    // Set up progress bar
    const progressBar = showProgress
        ? new cliProgress.SingleBar({
            format: 'Concatenating audio files |{bar}| {percentage}% || {value}/{total} files',
            barCompleteChar: '\u2588',
            barIncompleteChar: '\u2591',
        })
        : null;

    // Get total duration of all files
    const getDuration = promisify((file: string, cb: (err: Error | null, duration?: number) => void) => {
        ffmpeg.ffprobe(file, (err, metadata) => {
            if (err) return cb(err);
            cb(null, metadata.format.duration);
        });
    });

    let totalDuration = 0;
    for (const file of audioFiles) {
        try {
            const duration = await getDuration(file);
            totalDuration += duration || 0;
        } catch (error) {
            console.warn(`Warning: Could not get duration for file ${file}`);
        }
    }

    return new Promise((resolve, reject) => {
        if (progressBar) {
            progressBar.start(100, 0);
        }

        let command = ffmpeg();

        // Input concat file
        command
            .input(concatFilePath)
            .inputOptions(['-f concat', '-safe 0'])
            .output(outputPath)
            .outputOptions(['-c copy']); // Copy audio streams without re-encoding

        // Add progress handler
        if (progressBar) {
            command.on('progress', (progress) => {
                const percent = Math.min(100, Math.round((progress.percent || 0)));
                progressBar.update(percent);
            });
        }

        // Add event handlers
        command
            .on('end', async () => {
                if (progressBar) {
                    progressBar.stop();
                }

                // Clean up temp files
                try {
                    await fs.unlink(concatFilePath);
                    await fs.rmdir(tempDir);
                } catch (error) {
                    console.warn('Warning: Could not clean up temporary files', error);
                }

                resolve(outputPath);
            })
            .on('error', (err) => {
                if (progressBar) {
                    progressBar.stop();
                }
                reject(new Error(`FFmpeg error: ${err.message}`));
            });

        // Run the command
        command.run();
    });
}

export default concatenateAudioFiles;