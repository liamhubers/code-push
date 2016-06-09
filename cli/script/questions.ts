`
File hashing needs to be done on the native side.
Signature/claims verification can be done on the js side.

Have them optional by default (for now, while we iron it out). Hooks:
    - Read from package.json on the CLI end
    - Expose custom functions to be used in syncStatusChanged callbacks on the plugins.

Will need to implement native pieces for react-native, not necessarily for Cordova. Don't need to expose those pieces to users (it's up to
them to use native plugins/etc if they want it).

SHA-2 and SHA-3 are safe against collision attacks (probably use SHA-256). MD5 is not, and SHA-1 is very close to being broken.

Components:

Certificate generation/management (Ignore for now)
    - User-generated? CLI generated?
    - Use iOS/Android store certificate?

Signing
    - Sign contents only? More stuff?
    - Build hook that can modify file contents (ts or js?)

Verification
    - Hook across multiple plugins (ts or js?)
    - Allow different things to be verified?
    - Allow encryption to be hooked in too?



https://www.objc.io/issues/17-security/inside-code-signing/
https://msdn.microsoft.com/en-us/library/ms537361(v=vs.85).aspx
https://www.raywenderlich.com/2915/ios-code-signing-under-the-hood

Should I go hardcore with certificates like Apple?
Do we need a root CodePush CA? Seems unnecessary, self-signed cert okay?
    - How do you put in a hook that is persisted? Or is it included in the update package?
Can we use a centralized certificate store that is not CodePush?

Where to generate certificates? Hook mechanism..?
Do certificates persist after you log out?

How do I bundle with single RN jsbundle files?

IF I want to sign stuff other than just the binary:
    How do I enforce ordering robustness?
    How will patch changes work?
    How will promote work?
        - (There is no package on disk)->download and re-release? seems slow.
        - 'Augment' the release with additional metadata? How do I reference the promoted package?
    How will rollback work?
    How will the release hook work exactly, and will it plug into the two above?
    How much stuff should I sign? e.g.:
        - deploymentKey, appVersion
        - key name? should I store the pub key on the server for convenience? (nah, this is e2e only)
        - be robust against re-ordering releases (sign label?)
        - be robust against rollout percentage?
        - how do I handle patch changes?

Should I version the signing protocol? What if it changes?
    - Yes, version the metadata. Newer plugins will be back-compatible with
        older versions, older plugins will be compatible with newer metadata versions if
        they are supersets



Having to resolve the deploymentKey on each release (or appName+deploymentName on update) is stupid (or is it?)

`;