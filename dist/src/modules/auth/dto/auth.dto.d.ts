export declare class AuthResponseDTO {
    walletAddress: string;
    accessToken: string;
}
export declare class RegisterUserDTO {
    name: string;
    country: string;
    twitterId?: string;
    image?: string;
    enterprise?: string;
}
export declare class AuthUserDTO {
    signature?: string;
    signedMessage?: string;
    accessToken?: string;
    register?: RegisterUserDTO;
}
