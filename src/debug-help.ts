import Debug from 'debug';
const debug = Debug("mb")

export default (file: string) => {
    return debug.extend(file)
}