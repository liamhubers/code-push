import * as crypto from "crypto";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import * as path from "path";
import * as q from "q";
import * as hashUtils from "./hash-utils";

export interface ReleaseHookParams {
    appName: string;
    deploymentName: string;
    appStoreVersion: string;
    fileOrDirectoryPath: string;
    basePath: string;
}

export function execute(params: ReleaseHookParams): q.Promise<void> {
    return sign(params);
}

var CURRENT_SIGNATURE_VERSION: string = "1.0.0";
var HASH_ALGORITHM: string = "sha256";
var PRIVATE_KEY_PATH: string;

interface CodeSigningClaims {
    version: string;
    // deploymentKey: string;
    // appStoreVersion: string;
    contentHash: string;
}

interface SignedMetadata extends CodeSigningClaims {
    signature: string;
}

function sign(params: ReleaseHookParams): q.Promise<void> {
    // If signature file already exists, throw error
    if (!fs.lstatSync(params.fileOrDirectoryPath).isDirectory()) {
        // TODO: Make it a directory
    }

    return hashUtils.generatePackageHash(params.fileOrDirectoryPath, params.basePath)
        .then((hash: string) => {
            var claims: CodeSigningClaims = {
                version: CURRENT_SIGNATURE_VERSION,
                contentHash: hash
            };

            return q.nfcall<string>(jwt.sign, claims, PRIVATE_KEY_PATH, { algorithm: "RS256" });
        })
        .then((signedJwt: string) => {
            console.log(signedJwt);
            // Write file to disk
        });
}