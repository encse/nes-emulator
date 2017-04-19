export class Formatter {

    public static format(st: string): string {
        let indent = 0;
        let res = '';
        const stmStack = [false];
        st.split('\n').forEach((line) => {
            line = line.trim();

            if (line === '') {

                res += '\n';

            } else {
                let currentIndent = indent;
                let nextIndent = indent;

                let started = false;
                line.split('').forEach((ch) => {
                    switch (ch) {
                        case '(':
                        case '{':
                        case '[':
                            started = true;
                            nextIndent++;
                            stmStack.push(false);
                            break;
                        case ']':
                        case ')':
                        case '}':
                            const indented = stmStack.pop();
                            if (indented) {
                                if (!started) {
                                    currentIndent--;
                                    nextIndent--;
                                } else {
                                    nextIndent--;
                                }
                            }

                            if (!started) {
                                currentIndent--;
                                nextIndent--;
                            } else {
                                nextIndent--;
                            }
                            break;
                    }
                });

                if (nextIndent === indent) {

                    // skip one line comments
                    if (!line.match(/^\/\//) && !line.match(/^\/\*/)) {

                        // unfinished statement -> indent
                        if (!line.match(/[;,\{\}]$/)) {
                            if (!stmStack[stmStack.length - 1]) {
                                // line = "/*q*/"+line;
                                nextIndent++;
                                stmStack[stmStack.length - 1] = true;
                            }
                        } else if (line.match(/[;\{\}]$/)) {
                            if (stmStack[stmStack.length - 1]) {
                                // line = "/*w*/"+line;

                                nextIndent--;
                                stmStack[stmStack.length - 1] = false;
                            }
                        }
                    }
                }
                res += Array(currentIndent + 1).join('    ') + line + '\n';
                indent = nextIndent;
            }

        });

        return res;
    }
}
