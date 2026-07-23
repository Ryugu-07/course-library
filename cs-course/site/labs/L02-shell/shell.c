#define _POSIX_C_SOURCE 200809L
#include <ctype.h>
#include <errno.h>
#include <fcntl.h>
#include <signal.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <unistd.h>

#define MAX_TOKENS 128
#define MAX_JOBS 32

typedef struct {
    char *argv[MAX_TOKENS];
    char *input;
    char *output;
} command;

static pid_t jobs[MAX_JOBS];
static size_t job_count;

static void reap_jobs(void) {
    for (size_t i = 0; i < job_count;) {
        int status;
        pid_t result = waitpid(jobs[i], &status, WNOHANG);
        if (result == jobs[i]) {
            fprintf(stderr, "[done %d]\n", jobs[i]);
            jobs[i] = jobs[--job_count];
        } else {
            ++i;
        }
    }
}

static char *operator_token(char op) {
    switch (op) {
        case '|': return "|";
        case '<': return "<";
        case '>': return ">";
        case '&': return "&";
        default: return "";
    }
}

static int tokenize(char *line, char **tokens) {
    int count = 0;
    char *p = line;
    while (*p && count < MAX_TOKENS - 1) {
        while (isspace((unsigned char)*p)) ++p;
        if (!*p) break;
        if (strchr("|<>&", *p)) {
            tokens[count++] = operator_token(*p++);
        } else {
            tokens[count++] = p;
            while (*p && !isspace((unsigned char)*p) && !strchr("|<>&", *p)) ++p;
            if (*p) {
                if (strchr("|<>&", *p)) {
                    char op = *p++;
                    p[-1] = '\0';
                    if (count < MAX_TOKENS - 1) tokens[count++] = operator_token(op);
                } else {
                    *p++ = '\0';
                }
            }
        }
    }
    tokens[count] = NULL;
    return count;
}

static int parse(char **tokens, int count, command *left, command *right, int *background) {
    memset(left, 0, sizeof(*left));
    memset(right, 0, sizeof(*right));
    *background = 0;
    command *current = left;
    int argc = 0;
    for (int i = 0; i < count; ++i) {
        if (strcmp(tokens[i], "|") == 0) {
            if (current == right || argc == 0) return -1;
            current->argv[argc] = NULL;
            current = right;
            argc = 0;
        } else if (strcmp(tokens[i], "<") == 0 || strcmp(tokens[i], ">") == 0) {
            if (++i >= count) return -1;
            if (tokens[i - 1][0] == '<') current->input = tokens[i];
            else current->output = tokens[i];
        } else if (strcmp(tokens[i], "&") == 0) {
            if (i != count - 1) return -1;
            *background = 1;
        } else {
            current->argv[argc++] = tokens[i];
        }
    }
    current->argv[argc] = NULL;
    return left->argv[0] ? 0 : -1;
}

static int redirect_files(const command *cmd) {
    if (cmd->input) {
        int fd = open(cmd->input, O_RDONLY);
        if (fd < 0 || dup2(fd, STDIN_FILENO) < 0) return -1;
        close(fd);
    }
    if (cmd->output) {
        int fd = open(cmd->output, O_WRONLY | O_CREAT | O_TRUNC, 0644);
        if (fd < 0 || dup2(fd, STDOUT_FILENO) < 0) return -1;
        close(fd);
    }
    return 0;
}

static void execute_child(const command *cmd) {
    if (redirect_files(cmd) < 0) {
        perror("redirect");
        _exit(126);
    }
    execvp(cmd->argv[0], cmd->argv);
    perror(cmd->argv[0]);
    _exit(errno == ENOENT ? 127 : 126);
}

static int run_pipeline(const command *left, const command *right, int background) {
    int pipefd[2] = {-1, -1};
    int has_pipe = right->argv[0] != NULL;
    if (has_pipe && pipe(pipefd) < 0) {
        perror("pipe");
        return 1;
    }
    pid_t first = fork();
    if (first == 0) {
        if (has_pipe) {
            dup2(pipefd[1], STDOUT_FILENO);
            close(pipefd[0]); close(pipefd[1]);
        }
        execute_child(left);
    }
    if (first < 0) {
        perror("fork");
        return 1;
    }
    pid_t last = first;
    if (has_pipe) {
        last = fork();
        if (last == 0) {
            dup2(pipefd[0], STDIN_FILENO);
            close(pipefd[0]); close(pipefd[1]);
            execute_child(right);
        }
        close(pipefd[0]); close(pipefd[1]);
        if (last < 0) {
            perror("fork");
            waitpid(first, NULL, 0);
            return 1;
        }
    }
    if (background) {
        if (job_count < MAX_JOBS) jobs[job_count++] = last;
        fprintf(stderr, "[bg %d]\n", last);
        if (has_pipe) waitpid(first, NULL, 0);
        return 0;
    }
    int status = 0;
    waitpid(first, &status, 0);
    if (has_pipe) waitpid(last, &status, 0);
    return WIFEXITED(status) ? WEXITSTATUS(status) : 128;
}

int main(void) {
    char *line = NULL;
    size_t capacity = 0;
    int interactive = isatty(STDIN_FILENO);
    signal(SIGINT, SIG_IGN);
    for (;;) {
        reap_jobs();
        if (interactive) {
            fputs("msh$ ", stdout);
            fflush(stdout);
        }
        if (getline(&line, &capacity, stdin) < 0) break;
        char *tokens[MAX_TOKENS];
        command left, right;
        int background;
        int count = tokenize(line, tokens);
        if (count == 0) continue;
        if (parse(tokens, count, &left, &right, &background) < 0) {
            fprintf(stderr, "syntax error\n");
            continue;
        }
        if (!right.argv[0] && strcmp(left.argv[0], "exit") == 0) break;
        if (!right.argv[0] && strcmp(left.argv[0], "cd") == 0) {
            const char *path = left.argv[1] ? left.argv[1] : getenv("HOME");
            if (!path || chdir(path) < 0) perror("cd");
            continue;
        }
        if (!right.argv[0] && strcmp(left.argv[0], "jobs") == 0) {
            reap_jobs();
            for (size_t i = 0; i < job_count; ++i) printf("%d\n", jobs[i]);
            continue;
        }
        run_pipeline(&left, &right, background);
    }
    free(line);
    while (job_count) waitpid(jobs[--job_count], NULL, 0);
    return 0;
}
