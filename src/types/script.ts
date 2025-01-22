export type SingleStatement = {
    text: string;
    pauseAfter?: number;
}

export type VoicedStatement = SingleStatement & {
    filename: string;
}

export type Script = SingleStatement[];


export type BasicStatements = {
    text: string;
    filename: string;
    voiceId?: string;
}