import fs from 'fs';
import path from 'path';

export interface VisionAnalysisResult {
    agent_prompt: string;
    error?: string;
    [key: string]: any;
}

export abstract class VisionProvider {
    abstract runAnalysis(mdFilePath: string, imagePaths: string[], outputPath: string): Promise<VisionAnalysisResult>;

    protected encodeLocalImage(imagePath: string): string {
        if (!fs.existsSync(imagePath) || !fs.statSync(imagePath).isFile()) {
            throw new Error(`Image path does not exist or is not a file: ${imagePath}`);
        }

        const ext = path.extname(imagePath).toLowerCase();
        let mimeType = 'application/octet-stream';
        if (ext === '.png') mimeType = 'image/png';
        else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
        else if (ext === '.gif') mimeType = 'image/gif';
        else if (ext === '.webp') mimeType = 'image/webp';

        const b64 = fs.readFileSync(imagePath).toString('base64');
        return `data:${mimeType};base64,${b64}`;
    }

    protected buildImageContents(imageInputs: string[]): any[] {
        if (!imageInputs || imageInputs.length === 0) {
            throw new Error("At least one image must be supplied.");
        }

        const contents: any[] = [];
        for (let raw of imageInputs) {
            raw = raw.trim();
            let url = raw;
            if (!raw.startsWith("http://") && !raw.startsWith("https://")) {
                url = this.encodeLocalImage(raw);
            }
            contents.push({ type: "image_url", image_url: { url: url } });
        }
        return contents;
    }

    protected writeJson(outputPath: string, data: any): void {
        try {
            fs.mkdirSync(path.dirname(outputPath), { recursive: true });
            fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');
        } catch (exc) {
            throw new Error(`Failed to write JSON output to ${outputPath}`);
        }
    }
}
