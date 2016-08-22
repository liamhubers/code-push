import * as cli from "../../definitions/cli";
import * as crypto from "crypto";
import * as fs from "fs";
import * as jwt from "jsonwebtoken";
import * as path from "path";
import * as q from "q";
import * as hashUtils from "../hash-utils";

var CURRENT_CLAIM_VERSION: string = "1.0.0";
var METADATA_FILE_NAME: string = ".codepushrelease"

interface CodeSigningClaims {
    claimVersion: string;
    // deploymentKey: string;
    // appStoreVersion: string;
    contentHash: string;
}

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


export default function sign(command: cli.IReleaseCommand): q.Promise<cli.IReleaseCommand> {
    console.dir(command);
    console.log();

    // If signature file already exists, throw error
    if (!fs.lstatSync(command.path).isDirectory()) {
        // TODO: Make it a directory
        throw new Error("Signing something that's not a directory");
    }

    var signatureFilePath = path.join(command.path, METADATA_FILE_NAME);

    return q(<void>null)
        .then(() => {
            if (fs.exists(signatureFilePath)) {
                console.log(`Deleting previous release signature at ${signatureFilePath}`);
                return q.nfcall(fs.unlink, signatureFilePath);
            }
        })
        .then(() => {
            return hashUtils.generatePackageHashFromDirectory(command.path, path.join(command.path, ".."));
        })
        .then((hash: string) => {
            console.log(hash);
            console.log();
            var claims: CodeSigningClaims = {
                claimVersion: CURRENT_CLAIM_VERSION,
                contentHash: hash
            };

            // TODO: x5t?
            return q.nfcall<string>(jwt.sign, claims, privateKey, { algorithm: "RS256" });
        })
        .then((signedJwt: string) => {
            console.log(signedJwt);
            console.log();
            var deferred = q.defer<void>();

            fs.writeFile(signatureFilePath, signedJwt, (err: Error) => {
                if (err) {
                    deferred.reject(err);
                } else {
                    console.log(`Generated a release signature and wrote it to ${signatureFilePath}`);
                    deferred.resolve(<void>null);
                }
            });

            return deferred.promise;
        })
        .then(() => command)
        .catch((err: Error) => {
            err.message = `Could not sign package: ${err.message}`;
            return q.reject<cli.IReleaseCommand>(err);
        });
}