import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { db } from "@/lib/db";

const execAsync = promisify(exec);

export interface ExecutionToolResult {
  success: boolean;
  output?: string;
  error?: string;
  action: string;
  target?: string;
}

/**
 * Autonomous Workspace Execution Engine
 * Grants Superpowers AI agents the direct ability to:
 * 1. Create & Edit Files (write_file)
 * 2. Read Project Files (read_file)
 * 3. Run Shell Commands / Package Installs (run_command e.g. npm install, git, test)
 * 4. Autonomous Validation & Verification
 */
export class AutonomousExecutor {
  private static workspaceRoot = process.cwd();

  /**
   * 1. Create or Overwrite a file directly on disk
   */
  public static async writeFile(filePath: string, content: string, agentId = "agent-mgr-eng-001"): Promise<ExecutionToolResult> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceRoot, filePath);
      const dir = path.dirname(fullPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(fullPath, content, "utf8");

      db.logActivity({
        projectId: null,
        agentId,
        actorRole: "DIVISION_MANAGER",
        action: "AUTONOMOUS_FILE_CREATED",
        details: `File created directly on disk: ${filePath} (${content.length} chars)`,
        payload: { filePath, charCount: content.length },
      });

      return {
        success: true,
        action: "WRITE_FILE",
        target: filePath,
        output: `File successfully written: ${filePath}`,
      };
    } catch (err: any) {
      return {
        success: false,
        action: "WRITE_FILE",
        target: filePath,
        error: err.message,
      };
    }
  }

  /**
   * 2. Read file contents directly from disk
   */
  public static async readFile(filePath: string): Promise<ExecutionToolResult> {
    try {
      const fullPath = path.isAbsolute(filePath) ? filePath : path.join(this.workspaceRoot, filePath);
      if (!fs.existsSync(fullPath)) {
        return {
          success: false,
          action: "READ_FILE",
          target: filePath,
          error: `File not found: ${filePath}`,
        };
      }

      const content = fs.readFileSync(fullPath, "utf8");
      return {
        success: true,
        action: "READ_FILE",
        target: filePath,
        output: content,
      };
    } catch (err: any) {
      return {
        success: false,
        action: "READ_FILE",
        target: filePath,
        error: err.message,
      };
    }
  }

  /**
   * 3. Run terminal shell commands (e.g. npm install, node test, git status)
   */
  public static async runCommand(command: string, agentId = "agent-mgr-eng-001"): Promise<ExecutionToolResult> {
    try {
      // Execute command in workspace root
      const { stdout, stderr } = await execAsync(command, {
        cwd: this.workspaceRoot,
        timeout: 60000, // 60s timeout
      });

      db.logActivity({
        projectId: null,
        agentId,
        actorRole: "DIVISION_MANAGER",
        action: "AUTONOMOUS_COMMAND_EXECUTED",
        details: `Command executed: ${command.slice(0, 80)}...`,
        payload: { command, stdout: stdout.slice(0, 200), stderr: stderr.slice(0, 200) },
      });

      return {
        success: true,
        action: "RUN_COMMAND",
        target: command,
        output: stdout || stderr || "Command finished with exit code 0",
      };
    } catch (err: any) {
      return {
        success: false,
        action: "RUN_COMMAND",
        target: command,
        error: err.message,
        output: err.stdout,
      };
    }
  }
}
