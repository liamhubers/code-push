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
    console.log("Called release hook with:");
    console.dir(params);
    return sign(params);
}

var CURRENT_SIGNATURE_VERSION: string = "1.0.0";
var HASH_ALGORITHM: string = "sha256";
var PRIVATE_KEY_PATH: string;

interface CodeSigningClaims {
    version: string;
    // deploymentKey: string;
    // appStoreVersion: string;
    hash: string;
}

// interface SignedMetadata extends CodeSigningClaims {
//     signature: string;
// }

// Test keys, not sensitive
var privateKey =
`-----BEGIN RSA PRIVATE KEY-----
MIICXAIBAAKBgQCXssUrApjU2tifOTcN18tufCIJkPlvBvul+n4VbSUixJ21DZzp
Vd4mNhKw54dKI6j5TF5xvwAcrCoeJwFR2pKKZJN2mbUv6TMatNHCXsTctrJv+zvi
0JjPF59DdCwP1CPe4m/c2N4wH+3pMUQvR4bM+q6RGXyD4f2846NDHTUrrwIDAQAB
AoGAbVpubYnKuC4mV+k7uZvkxvlu4+yBErs67rQ67aEnUv/fG+P7R+0hXfQ+1w2f
5h78sPGPZ3mjUAf/uIqvldz1IvLcQE50WqDuUazdz+69a8B/Fvc2GpSj36znl5rM
Xc3Kp4coYw4/APikXFd4yHLZbIbKxz5a2j5zzSW6AZBMWuECQQDvDy3yO+7vd1cZ
WOyAF9N36PSCQzJV4dbbA6xDAsTj3u+dPaLb2MkHr7boNPOSOo1sZk6QP6a3RgwZ
qh9I2RqxAkEAonLCLtvMrQUX4+Q7R49l6DTZBr+TkOm99tmnmRgJOVg5TCS/svTs
SP0VlTx4QR08+w6066+Tlr8P82/dNzGEXwJAd4vKuTj5amzudHGAiynfCTbIlx+N
W189d3alvTj0RtOkVaiN+Yy2Mw7O094u87AuKsgaf44lC7+Oq4LkdCSFcQJAQDnt
Cke+sX19B4353f4VBWy3jZJ6zmWLxKgjOkUliHWYGcHBxQhOz0C4ostIpD3iGUSk
RTaivIwHy3Cj3qmGMwJBAI8uN+M6M6i0jorGNhd11cM357a7qy27/YkX3eBnIoop
gAGzxXWZ6sxSXRF5rOZ9wibMC6Nh9JzAGX0YJ53OpXo=
-----END RSA PRIVATE KEY-----`;

var publicKey =
`-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCXssUrApjU2tifOTcN18tufCIJ
kPlvBvul+n4VbSUixJ21DZzpVd4mNhKw54dKI6j5TF5xvwAcrCoeJwFR2pKKZJN2
mbUv6TMatNHCXsTctrJv+zvi0JjPF59DdCwP1CPe4m/c2N4wH+3pMUQvR4bM+q6R
GXyD4f2846NDHTUrrwIDAQAB
-----END PUBLIC KEY-----`;

function sign(params: ReleaseHookParams): q.Promise<void> {
    // If signature file already exists, throw error
    if (!fs.lstatSync(params.fileOrDirectoryPath).isDirectory()) {
        // TODO: Make it a directory
        throw new Error("Signing something that's not a directory");
    }

    return hashUtils.generatePackageHashFromDirectory(params.fileOrDirectoryPath, params.basePath)
        .then((hash: string) => {
            console.log("hash: " + hash);
            var claims: CodeSigningClaims = {
                version: CURRENT_SIGNATURE_VERSION,
                hash: hash
            };

            // TODO: x5t?
            return q.nfcall<string>(jwt.sign, claims, privateKey, { algorithm: "RS256" });
        })
        .then((signedJwt: string) => {
            console.log(signedJwt);
            // Write file to disk
        });
}