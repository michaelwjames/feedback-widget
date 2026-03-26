export interface VisionAnalysisResult {
    prompt_for_jules: string;
    [key: string]: any;
}

export interface VisionProvider {
    runAnalysis(mdFilePath: string, imagePaths: string[], outputPath: string): Promise<VisionAnalysisResult>;
}
