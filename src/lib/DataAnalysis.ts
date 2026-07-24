// Browser-based dataset loader. CSV templates live under `public/Test Data/...`
// and are fetched at runtime. The browser has no directory-listing API for
// static assets, so the example file list is declared explicitly below.

interface SignalSegment {
    x: number[];
    y: number[];
    z: number[];
}

interface DetectedExercise {
    exercise: string | null;
    confidence?: number;
    raw_dtw_score: number;
    start: number;
    end: number;
}

type TemplateTuple = [string, SignalSegment];
type ExampleTuple = [string, SignalSegment];
type PendingStartTuple = [number, string, number]; // [abs_start, exercise_type, distance]
type BoundaryTuple = [number, number, string, string, number]; // [start_abs, end_abs, start_ex, end_ex, distance]

// Relative URL prefix for Vite's public dir. Respects the configured `base`.
const PUBLIC_BASE = import.meta.env.BASE_URL;
const DATASET_ROOT = `${PUBLIC_BASE}Test Data/Seeed Xiao nrf52840 Sense`;

// Known example_*.csv files per exercise folder (sourced from the Test Data dir).
// Adding a new template file means adding its filename here.
const DATASET_MANIFEST: Record<string, string[]> = {
    "Bench Normal": [
        "example_exercise_1_bench_press_75lbs.csv",
        "example_exercise_2_bench_press_75lbs.csv",
    ],
    "Calf Raises": [
        "example_001_calf_raises_right_ankle.csv",
        "example_002_calf_raises_right_ankle.csv",
        "example_003_calf_raises_right_ankle.csv",
        "example_004_calf_raises_right_ankle.csv",
        "example_005_calf_raises_right_ankle.csv",
    ],
    "Dumbbell Curl": [
        "example_exercise_1_dumbbell_curl_25lbs.csv",
        "example_exercise_2_dumbbell_curl_25lbs.csv",
    ],
    "Squats": [
        "example_001_right_ankle_squat.csv",
        "example_002_right_ankle_squat.csv",
        "example_003_right_ankle_squat.csv",
        "example_004_right_ankle_squat.csv",
        "example_005_right_ankle_squat.csv",
    ],
    "Walking": [
        "example_001_walking_right_step.csv",
        "example_002_walking_right_step.csv",
        "example_003_walking_right_step.csv",
        "example_004_walking_right_step.csv",
        "example_005_walking_right_step.csv",
    ],
    "Push Ups": [
        "example_exercise_1_pushups.csv",
        "example_exercise_2_pushups.csv",
    ],
};

export class DataAnalysis {
    private exerciseTypeDirectories: string[];
    private bufferSize: number;
    private repExamples: SignalSegment[][];

    private startTemplates: TemplateTuple[] = [];
    private endTemplates: TemplateTuple[] = [];
    private templateChunkSize: number = 12;
    private templateThreshold: number = 0.7;

    private rollingBuffer: SignalSegment = { x: [], y: [], z: [] };
    private maxBufferSize: number = 300;
    private minRepLength: number = 30;
    private lastPeakIndex: number = -1;
    private processedBufferLength: number = 0;

    private pendingStart: PendingStartTuple | null = null;
    private state: "LOOKING_FOR_START" | "LOOKING_FOR_END" = "LOOKING_FOR_START";
    private cooldownSamples: number = 0;
    private lastDetectedEnd: number = -1;
    private lookingForEndStartSample: number = 0;

    private allExamples: ExampleTuple[] = [];
    private minExamplesLength: number = 50;
    private dtwThreshold: number = 30;

    private allPathsString: string = "";

    // Resolves once template CSVs have been fetched and parsed. Await this
    // before relying on repExamples / detection results.
    public ready: Promise<void>;

    constructor(bufferSize: number) {
        this.exerciseTypeDirectories = [
            "Bench Normal",
            "Calf Raises",
            "Dumbbell Curl",
            "Squats",
            "Walking",
            "Push Ups",
        ];

        this.bufferSize = bufferSize;
        this.repExamples = [];

        this.ready = this._loadDatasets();







    }

    private async _loadDatasets(): Promise<void> {
        try {
            this.repExamples = await this.getDatasets();


            // Build example reference for sliding window matching
            this._extractTemplates();
            this.repExamples.forEach((exerciseTypeList, i) => {
                const exerciseType = this.exerciseTypeDirectories[i];
                exerciseTypeList.forEach((example) => {
                    this.allExamples.push([exerciseType, example]);
                });
            });
            this._calculateMinLength();
            

        } catch (err) {
            console.error("Failed to load datasets:", err);
            this.repExamples = [];
        }
    }

    /**
     * Replaces scipy.spatial.distance.euclidean
     */
    private euclidean(p1: number[], p2: number[]): number {
        return Math.sqrt(
            Math.pow(p1[0] - p2[0], 2) +
            Math.pow(p1[1] - p2[1], 2) +
            Math.pow(p1[2] - p2[2], 2)
        );
    }

    /**
     * Translates the Dynamic Time Warping logic using custom matrix handling
     */
    public dtwDistance(signal1: SignalSegment, signal2: SignalSegment): number {
        const n = signal1.x.length;
        const m = signal2.x.length;

        // Initialize an (n + 1) x (m + 1) matrix with Infinity
        const dtwMatrix: number[][] = Array.from({ length: n + 1 }, () =>
            Array(m + 1).fill(Infinity)
        );
        dtwMatrix[0][0] = 0;

        for (let i = 1; i <= n; i++) {
            for (let j = 1; j <= m; j++) {
                const point1 = [signal1.x[i - 1], signal1.y[i - 1], signal1.z[i - 1]];
                const point2 = [signal2.x[j - 1], signal2.y[j - 1], signal2.z[j - 1]];

                const cost = this.euclidean(point1, point2);
                dtwMatrix[i][j] = cost + Math.min(
                    dtwMatrix[i - 1][j],     // Insertion
                    dtwMatrix[i][j - 1],     // Deletion
                    dtwMatrix[i - 1][j - 1]  // Match
                );
            }
        }

        return dtwMatrix[n][m];
    }

    /**
     * Fetches each CSV URL over HTTP and parses it into x/y/z arrays.
     */
    public async getDataFromFiles(listOfUrls: string[]): Promise<SignalSegment[]> {
        const allDictionaries: SignalSegment[] = [];

        for (const url of listOfUrls) {
            const x: number[] = [];
            const y: number[] = [];
            const z: number[] = [];

            try {
                const res = await fetch(url);
                if (!res.ok) {
                    console.error(`HTTP ${res.status} fetching ${url}`);
                    continue;
                }
                const fileContent = await res.text();
                const lines = fileContent.split(/\r?\n/);
                if (lines.length === 0) continue;

                // Extract headers and clean up any potential spaces/quotes
                const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

                const indexX = headers.indexOf('x');
                const indexY = headers.findIndex(h => h === 'y' || h === 'y');
                const indexZ = headers.findIndex(h => h === 'z' || h === 'z');

                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;

                    const row = line.split(',');
                    const rawX = row[indexX];
                    const rawY = row[indexY] || row[headers.indexOf('y')];
                    const rawZ = row[indexZ] || row[headers.indexOf('z')];

                    if (rawX !== undefined && rawY !== undefined && rawZ !== undefined) {
                        x.push(parseFloat(rawX.trim()));
                        y.push(parseFloat(rawY.trim()));
                        z.push(parseFloat(rawZ.trim()));
                    }
                }

                allDictionaries.push({ x, y, z });
            } catch (err) {
                console.error(`Error reading ${url}:`, err);
            }
        }

        return allDictionaries;
    }

    public getAllPathsString(): string {
        return this.allPathsString;
    }

    /**
     * Fetches the example CSVs declared in DATASET_MANIFEST and parses them
     * into per-exercise signal segments.
     */
    public async getDatasets(): Promise<SignalSegment[][]> {
        const examples: SignalSegment[][] = [];

        for (const folder of this.exerciseTypeDirectories) {
            const files = DATASET_MANIFEST[folder] ?? [];
            const urls = files.map(file => encodeURI(`${DATASET_ROOT}/${folder}/${file}`));

            this.allPathsString += urls.join("\n") + "\n";

            const currentExerciseTypeList = await this.getDataFromFiles(urls);
            examples.push(currentExerciseTypeList);
        }

        return examples;
    }

    public addToBuffer(x: number, y: number, z: number): void {
        this.rollingBuffer.x.push(x);
        this.rollingBuffer.y.push(y);
        this.rollingBuffer.z.push(z);
        this.processedBufferLength += 1;

        if (this.rollingBuffer.x.length > this.maxBufferSize) {
            this.rollingBuffer.x.shift(); // Replaces pop(0)
            this.rollingBuffer.y.shift();
            this.rollingBuffer.z.shift();
        }
    }

    private _extractTemplates(): void {
        this.startTemplates = [];
        this.endTemplates = [];

        this.repExamples.forEach((exerciseTypeList, i) => {
            const exerciseType = this.exerciseTypeDirectories[i];

            for (const example of exerciseTypeList) {
                const sigLen = example.x.length;
                if (sigLen < this.templateChunkSize * 2) {
                    continue; // Skip signals that are too short
                }

                // Extract start chunk (first N samples)
                const startChunk: SignalSegment = {
                    x: example.x.slice(0, this.templateChunkSize),
                    y: example.y.slice(0, this.templateChunkSize),
                    z: example.z.slice(0, this.templateChunkSize)
                };
                this.startTemplates.push([exerciseType, startChunk]);

                // Extract end chunk (last N samples)
                const endChunk: SignalSegment = {
                    x: example.x.slice(-this.templateChunkSize),
                    y: example.y.slice(-this.templateChunkSize),
                    z: example.z.slice(-this.templateChunkSize)
                };
                this.endTemplates.push([exerciseType, endChunk]);
            }
        });

        console.log(`Loaded ${this.startTemplates.length} start templates and ${this.endTemplates.length} end templates`);
    }

    private _calculateMinLength(): void {
        if (this.allExamples.length > 0) {
            this.minExamplesLength = Math.min(...this.allExamples.map(ex => ex[1].x.length));
        } else {
            this.minExamplesLength = 50;
        }
    }

    /**
     * Vector arithmetic calculation rewritten as structural native loops
     */
    private _euclideanChunkDistance(chunk1: SignalSegment, chunk2: SignalSegment): number {
        let sumSquares = 0;
        for (let i = 0; i < chunk1.x.length; i++) {
            const dx = chunk1.x[i] - chunk2.x[i];
            const dy = chunk1.y[i] - chunk2.y[i];
            const dz = chunk1.z[i] - chunk2.z[i];
            sumSquares += (dx * dx) + (dy * dy) + (dz * dz);
        }
        return Math.sqrt(sumSquares);
    }

    private _matchStartTemplate(bufferStartChunk: SignalSegment, threshold: number = 2.0): [string | null, number] {
        let bestMatch: string | null = null;
        let bestDistance = Infinity;

        for (const [exerciseType, template] of this.startTemplates) {
            const distance = this._euclideanChunkDistance(bufferStartChunk, template);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = exerciseType;
            }
        }

        if (bestDistance < threshold) {
            return [bestMatch, bestDistance];
        }
        return [null, bestDistance];
    }

    private _matchEndTemplate(bufferEndChunk: SignalSegment, threshold: number = 2.0): [string | null, number] {
        let bestMatch: string | null = null;
        let bestDistance = Infinity;

        for (const [exerciseType, template] of this.endTemplates) {
            const distance = this._euclideanChunkDistance(bufferEndChunk, template);
            if (distance < bestDistance) {
                bestDistance = distance;
                bestMatch = exerciseType;
            }
        }

        if (bestDistance < threshold) {
            return [bestMatch, bestDistance];
        }
        return [null, bestDistance];
    }

    private _findRepBoundaries(): BoundaryTuple[] {
        const currentBufLen = this.rollingBuffer.x.length;
        if (currentBufLen < this.templateChunkSize) {
            return [];
        }

        const boundaries: BoundaryTuple[] = [];
        const bufferWrapped = currentBufLen < this.processedBufferLength;
        const bufStartAbs = bufferWrapped ? (this.processedBufferLength - currentBufLen) : 0;

        // Decrement cooldown
        if (this.cooldownSamples > 0) {
            this.cooldownSamples -= 1;
        }

        // The "recent window" - slice out the last N items safely
        const recentChunk: SignalSegment = {
            x: this.rollingBuffer.x.slice(-this.templateChunkSize),
            y: this.rollingBuffer.y.slice(-this.templateChunkSize),
            z: this.rollingBuffer.z.slice(-this.templateChunkSize)
        };

        if (this.state === "LOOKING_FOR_START") {
            if (this.cooldownSamples === 0) {
                const [startMatch, startDist] = this._matchStartTemplate(recentChunk, this.templateThreshold);
                if (startMatch) {
                    const absStart = bufStartAbs + currentBufLen - this.templateChunkSize;
                    this.pendingStart = [absStart, startMatch, startDist];
                    this.state = "LOOKING_FOR_END";
                    this.lookingForEndStartSample = this.processedBufferLength;
                }
            }
        } else if (this.state === "LOOKING_FOR_END" && this.pendingStart) {
            const [pendingAbsStart, pendingExercise] = this.pendingStart;

            // Timeout check
            if (this.processedBufferLength - this.lookingForEndStartSample > 500) {
                this.pendingStart = null;
                this.state = "LOOKING_FOR_START";
                this.cooldownSamples = 3;
                return boundaries;
            }

            const [endMatch, endDist] = this._matchEndTemplate(recentChunk, this.templateThreshold);
            if (endMatch) {
                const absEnd = bufStartAbs + currentBufLen - this.templateChunkSize;
                if (absEnd - pendingAbsStart >= this.minRepLength && absEnd > this.lastDetectedEnd) {
                    boundaries.push([pendingAbsStart, absEnd, pendingExercise, endMatch, endDist]);
                    this.pendingStart = null;
                    this.state = "LOOKING_FOR_START";
                    this.cooldownSamples = 3;
                    this.lastDetectedEnd = absEnd;
                }
            }
        }

        return boundaries;
    }

    public detectExerciseType(rowIndex: number = 0): DetectedExercise[] {
        const detectedExercises: DetectedExercise[] = [];
        const boundaries = this._findRepBoundaries();

        for (const [startAbs, endAbs, startEx, endEx, templateConfidence] of boundaries) {
            const currentBufLen = this.rollingBuffer.x.length;
            const bufferWrapped = currentBufLen < this.processedBufferLength;
            const bufStartAbs = bufferWrapped ? (this.processedBufferLength - currentBufLen) : 0;

            let segStartBuf = startAbs - bufStartAbs;
            let segEndBuf = endAbs - bufStartAbs;

            if (segStartBuf < 0) segStartBuf = 0;
            if (segEndBuf > currentBufLen) segEndBuf = currentBufLen;

            if (segEndBuf <= segStartBuf) continue;

            const segment: SignalSegment = {
                x: this.rollingBuffer.x.slice(segStartBuf, segEndBuf),
                y: this.rollingBuffer.y.slice(segStartBuf, segEndBuf),
                z: this.rollingBuffer.z.slice(segStartBuf, segEndBuf)
            };

            if (segment.x.length < 10) continue;

            let bestMatch: string | null = null;
            let bestDistance = Infinity;

            console.log("--------------------------------------------------------------------------");
            for (const [exerciseType, example] of this.allExamples) {
                const distance = this.dtwDistance(segment, example);
                console.log(`distance ${distance}- - exercise_type ${exerciseType}`);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestMatch = exerciseType;
                }
            }

            if (bestMatch && bestDistance < this.dtwThreshold) {
                const confidence = Math.max(0, ((this.dtwThreshold - bestDistance) / this.dtwThreshold) * 100);
                detectedExercises.push({
                    exercise: bestMatch,
                    confidence: confidence,
                    raw_dtw_score: bestDistance,
                    start: startAbs,
                    end: endAbs
                });
            } else {
                const r: DetectedExercise = {
                    exercise: bestMatch,
                    raw_dtw_score: bestDistance,
                    start: startAbs,
                    end: endAbs
                };
                console.log("NO MATCH FOUND << ");
                console.log(JSON.stringify(r));
            }
        }

        return detectedExercises;
    }
}
