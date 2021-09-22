declare type React = {}

declare module '*.module.scss' {
    const classes: { readonly [key: string]: string };
    export default classes;
}
declare module '*.scss';