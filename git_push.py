import os
import subprocess
import urllib.parse
import sys

def run_git_command(command, hide_output=False):
    """Execute a git command and return success status and output"""
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            check=True, 
            capture_output=True, 
            text=True
        )
        if not hide_output:
            print(f"Success: {result.stdout}")
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error executing '{command}': {e.stderr}")
        return False, e.stderr

def setup_git():
    """Initialize and configure git"""
    commands = [
        'rm -rf .git',
        'git init',
        'git config --global user.name "BillingDog"',
        'git config --global user.email "billingapp@example.com"',
        'git config --global init.defaultBranch main',
        'git config --global --add safe.directory /home/runner/workspace'
    ]
    
    for cmd in commands:
        success, _ = run_git_command(cmd)
        if not success:
            print(f"Failed to execute: {cmd}")
            return False
    return True

def commit_files():
    """Stage and commit all files"""
    commands = [
        'git add .',
        'git commit -m "Initial commit: Healthcare billing application with crypto payment support"'
    ]
    
    for cmd in commands:
        success, _ = run_git_command(cmd)
        if not success:
            print(f"Failed to execute: {cmd}")
            return False
    return True

def push_to_github():
    """Main function to push code to GitHub"""
    print("Starting GitHub push process...")
    
    # Get GitHub token
    token = os.environ.get('GITHUB_TOKEN')
    if not token:
        print("Error: GitHub token not found in environment variables")
        return False
        
    # Setup git
    if not setup_git():
        print("Failed to setup git")
        return False
        
    # Commit files
    if not commit_files():
        print("Failed to commit files")
        return False
        
    # Configure remote with encoded token
    encoded_token = urllib.parse.quote(token, safe='')
    remote_url = f'https://{encoded_token}@github.com/raimp001/HealthBillPay.git'
    
    # Add remote and push
    commands = [
        f'git remote add origin "{remote_url}"',
        'git branch -M main',
        'git push -u origin main --force'
    ]
    
    for cmd in commands:
        # Hide output for commands containing the token
        hide_output = 'remote add origin' in cmd
        success, output = run_git_command(cmd, hide_output)
        if not success:
            if 'remote add origin' in cmd:
                print("Failed to add remote")
            else:
                print(f"Failed to execute: {cmd}")
            return False
    
    print("Successfully pushed code to GitHub!")
    return True

if __name__ == '__main__':
    success = push_to_github()
    sys.exit(0 if success else 1)