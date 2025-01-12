import { randomUUID } from "crypto";
import supabase from "./supabase";
import path from "path";
import { decode } from "base64-arraybuffer";
import config from "../../utils/config";

export async function getRandomFilename(
    extension: string,
    bucket: string = "lesson-data"
) {
    let filename = `${Date.now()}-${randomUUID()}.${extension}`;

    do {
        const { data, error } = await supabase.storage
            .from(bucket)
            .list(filename);

        if (error) {
            throw error;
        }

        if (data?.length === 0) {
            return filename;
        }

        filename = `${Date.now()}-${randomUUID()}`;
    } while (true);
}

export async function uploadFile(
    arrayBuffer: ArrayBuffer,
    extension: string,
    bucket: string = "lesson-data",
    options: {
        path?: string;
        contentType?: string;
    } = {}
) {
    const filename = await getRandomFilename(extension, bucket);

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path.join(options.path || "", filename), arrayBuffer, {
            contentType: options.contentType || "application/octet-stream",
            cacheControl: (60 * 60 * 24 * 365).toString(),
        });

    if (error) {
        throw error;
    }

    const publicUrl = `${config.get("SUPABASE_URL")}/storage/v1/object/public/${
        data.fullPath
    }`;

    return publicUrl;
}
