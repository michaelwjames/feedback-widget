import os
import time
import json
import argparse
import sys
from typing import Optional, Dict, Any, List, cast
from dotenv import load_dotenv
import requests

class JulesClient:
    BASE_URL = "https://jules.googleapis.com/v1alpha"

    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Jules API Key is required. Set JULES_API_KEY env var or pass it explicitly.")
        self.api_key = api_key
        self.headers = {
            "x-goog-api-key": self.api_key,
            "Content-Type": "application/json"
        }

    def list_sources(self, page_size: int = 30, page_token: Optional[str] = None, 
                     filter_expr: Optional[str] = None) -> Dict[str, Any]:
        """Lists all sources (repositories) connected to your account.
        
        Args:
            page_size: Number of sources to return (1-100). Defaults to 30.
            page_token: Page token from a previous ListSources response.
            filter_expr: Filter expression (e.g., 'name=sources/source1 OR name=sources/source2')
        
        Returns:
            Dict containing 'sources' list and optional 'nextPageToken'
        """
        url = f"{self.BASE_URL}/sources"
        params: Dict[str, Any] = {"pageSize": page_size}
        if page_token:
            params["pageToken"] = page_token
        if filter_expr:
            params["filter"] = filter_expr
            
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_data = {
                "error": "Error listing sources",
                "details": str(e)
            }
            if hasattr(e, 'response') and e.response is not None:
                error_data["response"] = e.response.content.decode()
            print(json.dumps(error_data, indent=2))
            raise

    def get_source(self, source_id: str) -> Dict[str, Any]:
        """Retrieves a single source by ID.
        
        Args:
            source_id: The source ID (e.g., 'github-myorg-myrepo')
        
        Returns:
            Dict containing source details including branches
        """
        url = f"{self.BASE_URL}/sources/{source_id}"
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_data = {
                "error": "Error getting source",
                "details": str(e)
            }
            if hasattr(e, 'response') and e.response is not None:
                error_data["response"] = e.response.content.decode()
            print(json.dumps(error_data, indent=2))
            raise

    def get_source_id(self, repo_name: str) -> str:
        """Finds the internal Source ID for a given GitHub repository name."""
        try:
            sources_data = self.list_sources(page_size=100)
            sources = sources_data.get("sources", [])
            
            for source in sources:
                github_repo = source.get("githubRepo", {})
                owner = github_repo.get("owner", "")
                repo = github_repo.get("repo", "")
                full_name = f"{owner}/{repo}"
                
                if full_name == repo_name or repo_name in source.get("name", ""):
                    return source["name"]
            
            raise ValueError(f"Repository '{repo_name}' not found in connected sources. Please connect it in the Jules web UI first.")
        except requests.exceptions.RequestException as e:
            error_data = {
                "error": "Error fetching sources",
                "details": str(e)
            }
            print(json.dumps(error_data, indent=2))
            sys.exit(1)

    def create_session(self, prompt: str, title: Optional[str] = None, 
                      source_id: Optional[str] = None, starting_branch: str = "main",
                      require_plan_approval: bool = False, 
                      automation_mode: str = "AUTOMATION_MODE_UNSPECIFIED") -> Dict[str, Any]:
        """Creates a new Jules session.
        
        Args:
            prompt: The task description for Jules to execute
            title: Optional title for the session
            source_id: Source repository name (e.g., 'sources/github-myorg-myrepo')
            starting_branch: Branch to start from (default: 'main')
            require_plan_approval: If true, plans require explicit approval
            automation_mode: 'AUTOMATION_MODE_UNSPECIFIED' or 'AUTO_CREATE_PR'
        
        Returns:
            Dict containing the created session
        """
        url = f"{self.BASE_URL}/sessions"
        
        payload: Dict[str, Any] = {
            "prompt": prompt,
            "automationMode": automation_mode
        }
        
        if title:
            payload["title"] = title

        if source_id:
            payload["sourceContext"] = {
                "source": source_id,
                "githubRepoContext": {
                    "startingBranch": starting_branch
                }
            }
            if not title:
                # Use cast to Any to avoid slicing linter errors in this environment
                short_prompt = cast(Any, prompt)[:30]
                payload["title"] = f"Task: {short_prompt}..."
        else:
            if not title:
                payload["title"] = "Repoless Session"
        
        if require_plan_approval:
            payload["requirePlanApproval"] = True

        try:
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_data = {
                "error": "Error creating session",
                "details": str(e)
            }
            if hasattr(e, 'response') and e.response is not None:
                error_data["response"] = e.response.content.decode()
            print(json.dumps(error_data, indent=2))
            raise

    def list_sessions(self, page_size: int = 30, page_token: Optional[str] = None) -> Dict[str, Any]:
        """Lists all sessions for the authenticated user.
        
        Args:
            page_size: Number of sessions to return (1-100). Defaults to 30.
            page_token: Page token from a previous ListSessions response.
        
        Returns:
            Dict containing 'sessions' list and optional 'nextPageToken'
        """
        url = f"{self.BASE_URL}/sessions"
        params: Dict[str, Any] = {"pageSize": page_size}
        if page_token:
            params["pageToken"] = page_token
            
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_data = {
                "error": "Error listing sessions",
                "details": str(e)
            }
            if hasattr(e, 'response') and e.response is not None:
                error_data["response"] = e.response.content.decode()
            print(json.dumps(error_data, indent=2))
            raise

    def get_session(self, session_id: str) -> Dict[str, Any]:
        """Retrieves a single session by ID.
        
        Args:
            session_id: The session ID (numeric part only, e.g., '1234567')
        
        Returns:
            Dict containing full session details including outputs if completed
        """
        url = f"{self.BASE_URL}/sessions/{session_id}"
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_data = {
                "error": "Error getting session",
                "details": str(e)
            }
            if hasattr(e, 'response') and e.response is not None:
                error_data["response"] = e.response.content.decode()
            print(json.dumps(error_data, indent=2))
            raise

    def delete_session(self, session_id: str) -> bool:
        """Deletes a session.
        
        Args:
            session_id: The session ID (numeric part only, e.g., '1234567')
        
        Returns:
            True if successful
        """
        url = f"{self.BASE_URL}/sessions/{session_id}"
        try:
            response = requests.delete(url, headers=self.headers)
            response.raise_for_status()
            return True
        except requests.exceptions.RequestException as e:
            error_data = {
                "error": "Error deleting session",
                "details": str(e)
            }
            if hasattr(e, 'response') and e.response is not None:
                error_data["response"] = e.response.content.decode()
            print(json.dumps(error_data, indent=2))
            raise

    def send_message(self, session_id: str, message: str) -> Dict[str, Any]:
        """Sends a message from the user to an active session.
        
        Args:
            session_id: The session ID (numeric part only, e.g., '1234567')
            message: The message to send to the session
        
        Returns:
            Dict containing the response
        """
        url = f"{self.BASE_URL}/sessions/{session_id}:sendMessage"
        payload = {"prompt": message}
        
        try:
            response = requests.post(url, headers=self.headers, json=payload)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_data = {
                "error": "Error sending message",
                "details": str(e)
            }
            if hasattr(e, 'response') and e.response is not None:
                error_data["response"] = e.response.content.decode()
            print(json.dumps(error_data, indent=2))
            raise

    def approve_plan(self, session_id: str) -> Dict[str, Any]:
        """Approves a pending plan in a session.
        
        Args:
            session_id: The session ID (numeric part only, e.g., '1234567')
        
        Returns:
            Dict containing the response
        """
        url = f"{self.BASE_URL}/sessions/{session_id}:approvePlan"
        
        try:
            response = requests.post(url, headers=self.headers, json={})
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_data = {
                "error": "Error approving plan",
                "details": str(e)
            }
            if hasattr(e, 'response') and e.response is not None:
                error_data["response"] = e.response.content.decode()
            print(json.dumps(error_data, indent=2))
            raise

    def list_activities(self, session_id: str, page_size: int = 50, 
                       page_token: Optional[str] = None,
                       create_time: Optional[str] = None) -> Dict[str, Any]:
        """Lists all activities for a session.
        
        Args:
            session_id: The session ID (numeric part only, e.g., '1234567')
            page_size: Number of activities to return (1-100). Defaults to 50.
            page_token: Page token from a previous ListActivities response.
            create_time: Filter activities created after this timestamp
        
        Returns:
            Dict containing 'activities' list and optional 'nextPageToken'
        """
        url = f"{self.BASE_URL}/sessions/{session_id}/activities"
        params: Dict[str, Any] = {"pageSize": page_size}
        if page_token:
            params["pageToken"] = page_token
        if create_time:
            params["createTime"] = create_time
            
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_data = {
                "error": "Error listing activities",
                "details": str(e)
            }
            if hasattr(e, 'response') and e.response is not None:
                error_data["response"] = e.response.content.decode()
            print(json.dumps(error_data, indent=2))
            raise

    def get_activity(self, session_id: str, activity_id: str) -> Dict[str, Any]:
        """Retrieves a single activity by ID.
        
        Args:
            session_id: The session ID (numeric part only, e.g., '1234567')
            activity_id: The activity ID
        
        Returns:
            Dict containing activity details
        """
        url = f"{self.BASE_URL}/sessions/{session_id}/activities/{activity_id}"
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            error_data = {
                "error": "Error getting activity",
                "details": str(e)
            }
            if hasattr(e, 'response') and e.response is not None:
                error_data["response"] = e.response.content.decode()
            print(json.dumps(error_data, indent=2))
            raise

    def poll_session(self, session_name: str, stream_output: bool = False):
        """Polls the session for activities and status updates.
        
        Args:
            session_name: The session name to poll
            stream_output: If True, stream activities as they occur. If False, return final result.
        """
        activities_url = f"{self.BASE_URL}/{session_name}/activities"
        session_url = f"{self.BASE_URL}/{session_name}"
        
        seen_activities = set()
        activities_log: Any = []  # Use Any to bypass linter inference when it lacks stdlib access
        
        while True:
            # 1. Check Session Status
            try:
                sess_resp = requests.get(session_url, headers=self.headers)
                sess_resp.raise_for_status()
                session_data = sess_resp.json()
                state = session_data.get("state", "STATE_UNSPECIFIED")
            except Exception as e:
                error_result = {
                    "status": "error",
                    "error": str(e),
                    "session_name": session_name
                }
                if stream_output:
                    print(json.dumps(error_result, indent=2))
                return error_result

            # 2. Fetch Activities
            try:
                act_resp = requests.get(activities_url, headers=self.headers)
                act_resp.raise_for_status()
                activities = act_resp.json().get("activities", [])
                
                # Sort by creation time if available
                activities.sort(key=lambda x: x.get("createTime", ""), reverse=False)

                for activity in activities:
                    act_id = activity.get("id", "unknown")
                    if act_id not in seen_activities:
                        activity_data = {
                            "id": act_id,
                            "description": activity.get("description", "No description"),
                            "originator": activity.get("originator", "SYSTEM"),
                            "createTime": activity.get("createTime", "")
                        }
                        
                        if stream_output:
                            print(json.dumps(activity_data, indent=2))
                        
                        # Use spread syntax to avoid linter 'append' inference issue
                        activities_log = [*activities_log, activity_data]
                        seen_activities.add(act_id)

            except Exception:
                pass # Transient network errors shouldn't crash the loop immediately

            # 3. Handle Terminal States
            if state in ["COMPLETED", "FAILED", "CANCELLED"]:
                result = {
                    "status": "completed",
                    "state": state,
                    "session_name": session_name,
                    "activities": activities_log,
                    "session_data": session_data
                }
                
                if state == "COMPLETED" and "outputs" in session_data:
                    result["outputs"] = session_data["outputs"]
                
                if stream_output:
                    final_status = {
                        "status": "session_finished",
                        "state": state,
                        "session_name": session_name
                    }
                    print(json.dumps(final_status, indent=2))
                
                return result
            
            if state == "AWAITING_USER_FEEDBACK":
                result = {
                    "status": "awaiting_feedback",
                    "state": state,
                    "session_name": session_name,
                    "session_url": session_data.get("url", "URL not found"),
                    "activities": activities_log
                }
                
                if stream_output:
                    feedback_status = {
                        "status": "awaiting_user_feedback",
                        "session_url": session_data.get("url", "URL not found")
                    }
                    print(json.dumps(feedback_status, indent=2))
                
                return result

            time.sleep(2) # Poll interval

    def display_outputs(self, outputs: List[Dict[str, Any]]):
        """Returns output artifacts as structured data."""
        output_data = []
        
        for output in outputs:
            output_item = {}
            
            # Handle different output types based on API spec
            if "pullRequest" in output:
                output_item["type"] = "pull_request"
                output_item["url"] = output["pullRequest"].get("url", "No URL")
                output_item["details"] = output["pullRequest"]
            elif "fileChange" in output:
                output_item["type"] = "file_change"
                output_item["details"] = "Modified files available in session context"
                output_item["file_change_data"] = output["fileChange"]
            else:
                output_item["type"] = "unknown"
                output_item["details"] = str(output)
            
            output_data.append(output_item)
        
        return output_data

def main():
    parser = argparse.ArgumentParser(
        description="Jules Terminal Client - Comprehensive API Interface",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Create a repoless session
  python jules_client.py create --prompt "Build a FastAPI server"
  
  # Create a session with a repository
  python jules_client.py create --prompt "Add tests" --repo myorg/myrepo --branch develop
  
  # List all sessions
  python jules_client.py list-sessions
  
  # Get session details
  python jules_client.py get-session --session-id 1234567
  
  # Send a message to a session
  python jules_client.py send-message --session-id 1234567 --message "Add more tests"
  
  # Approve a plan
  python jules_client.py approve-plan --session-id 1234567
  
  # List sources
  python jules_client.py list-sources
        """
    )
    
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Create session command
    create_parser = subparsers.add_parser("create", help="Create a new session")
    create_parser.add_argument("--prompt", help="Instruction for Jules")
    create_parser.add_argument("--prompt-file", help="Path to JSON file with 'prompt_for_jules' or text file")
    create_parser.add_argument("--title", help="Optional session title")
    create_parser.add_argument("--repo", help="GitHub repository name (owner/repo) or Source ID")
    create_parser.add_argument("--branch", help="Starting branch for the session")
    create_parser.add_argument("--context-file", help="Path to a file to include as context")
    create_parser.add_argument("--require-approval", action="store_true", help="Require plan approval")
    create_parser.add_argument("--auto-pr", action="store_true", help="Automatically create PR")
    create_parser.add_argument("--no-poll", action="store_true", help="Don't poll for updates")
    create_parser.add_argument("--stream", action="store_true", help="Stream activities as they occur (JSON output)")
    
    # List sessions command
    list_sessions_parser = subparsers.add_parser("list-sessions", help="List all sessions")
    list_sessions_parser.add_argument("--page-size", type=int, default=30, help="Number of sessions to return")
    
    # Get session command
    get_session_parser = subparsers.add_parser("get-session", help="Get session details")
    get_session_parser.add_argument("--session-id", required=True, help="Session ID")
    
    # Delete session command
    delete_session_parser = subparsers.add_parser("delete-session", help="Delete a session")
    delete_session_parser.add_argument("--session-id", required=True, help="Session ID")
    
    # Send message command
    send_message_parser = subparsers.add_parser("send-message", help="Send a message to a session")
    send_message_parser.add_argument("--session-id", required=True, help="Session ID")
    send_message_parser.add_argument("--message", required=True, help="Message to send")
    
    # Approve plan command
    approve_plan_parser = subparsers.add_parser("approve-plan", help="Approve a pending plan")
    approve_plan_parser.add_argument("--session-id", required=True, help="Session ID")
    
    # List activities command
    list_activities_parser = subparsers.add_parser("list-activities", help="List session activities")
    list_activities_parser.add_argument("--session-id", required=True, help="Session ID")
    list_activities_parser.add_argument("--page-size", type=int, default=50, help="Number of activities to return")
    
    # Get activity command
    get_activity_parser = subparsers.add_parser("get-activity", help="Get activity details")
    get_activity_parser.add_argument("--session-id", required=True, help="Session ID")
    get_activity_parser.add_argument("--activity-id", required=True, help="Activity ID")
    
    # List sources command
    list_sources_parser = subparsers.add_parser("list-sources", help="List all connected sources")
    list_sources_parser.add_argument("--page-size", type=int, default=30, help="Number of sources to return")
    list_sources_parser.add_argument("--filter", help="Filter expression")
    
    # Get source command
    get_source_parser = subparsers.add_parser("get-source", help="Get source details")
    get_source_parser.add_argument("--source-id", required=True, help="Source ID")
    
    # Global arguments
    parser.add_argument("--api-key", help="Jules API Key")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return

    # Load environment variables
    load_dotenv()
    api_key = args.api_key or os.getenv("JULES_API_KEY")
    
    # Get default repo and branch from environment variables
    default_repo = os.getenv("JULES_DEFAULT_REPO")
    default_branch = os.getenv("JULES_DEFAULT_BRANCH", "dev")  # Default to dev branch

    if not api_key:
        error_response = {
            "error": "JULES_API_KEY not found",
            "message": "Set JULES_API_KEY environment variable or use --api-key argument"
        }
        print(json.dumps(error_response, indent=2))
        return

    client = JulesClient(api_key)

    try:
        if args.command == "create":
            if not args.prompt and not args.prompt_file:
                print(json.dumps({"error": "Either --prompt or --prompt-file must be provided"}, indent=2))
                return
            
            # Prepare Prompt
            if args.prompt_file:
                try:
                    with open(args.prompt_file, 'r') as f:
                        file_content = f.read()
                        try:
                            data = json.loads(file_content)
                            full_prompt = data.get("prompt_for_jules", str(data))
                        except json.JSONDecodeError:
                            full_prompt = file_content
                except FileNotFoundError:
                    print(json.dumps({"error": "Prompt file not found", "file": args.prompt_file}, indent=2))
                    return
            else:
                full_prompt = args.prompt
            if args.context_file:
                try:
                    with open(args.context_file, 'r') as f:
                        context_content = f.read()
                        full_prompt += f"\n\nContext from {args.context_file}:\n{context_content}"
                except FileNotFoundError:
                    error_response = {
                        "error": "Context file not found",
                        "file": args.context_file
                    }
                    print(json.dumps(error_response, indent=2))
                    return

            source_id = None
            if args.repo:
                if args.repo.startswith("sources/"):
                    source_id = args.repo
                else:
                    source_id = client.get_source_id(args.repo)
            elif default_repo:
                # Use default repo from environment
                source_id = client.get_source_id(default_repo)
            
            if not source_id:
                error_response = {
                    "error": "No repository configured",
                    "message": "Pass --repo or set JULES_DEFAULT_REPO environment variable"
                }
                print(json.dumps(error_response, indent=2))
                return
            
            # Use branch from arg, then env var, then default to "dev"
            branch = args.branch or default_branch or "dev"

            automation_mode = "AUTO_CREATE_PR" if args.auto_pr else "AUTOMATION_MODE_UNSPECIFIED"
            
            session = client.create_session(
                prompt=full_prompt,
                title=args.title,
                source_id=source_id,
                starting_branch=branch,
                require_plan_approval=args.require_approval,
                automation_mode=automation_mode
            )
            
            session_name = session.get("name")
            session_url = session.get("url")

            if not session_name:
                raise ValueError("Session created but no name returned from API")
            
            session_name_str = str(session_name)

            session_response = {
                "status": "session_created",
                "session_id": session_name,
                "session_url": session_url,
                "session_data": session
            }
            print(json.dumps(session_response, indent=2))
            
            if not args.no_poll:
                result = client.poll_session(session_name_str, stream_output=args.stream)
                print(json.dumps(result, indent=2))
            
        elif args.command == "list-sessions":
            result = client.list_sessions(page_size=args.page_size)
            print(json.dumps(result, indent=2))
        
        elif args.command == "get-session":
            session = client.get_session(args.session_id)
            print(json.dumps(session, indent=2))
        
        elif args.command == "delete-session":
            success = client.delete_session(args.session_id)
            response = {
                "status": "session_deleted",
                "session_id": args.session_id,
                "success": success
            }
            print(json.dumps(response, indent=2))
        
        elif args.command == "send-message":
            result = client.send_message(args.session_id, args.message)
            response = {
                "status": "message_sent",
                "session_id": args.session_id,
                "message": args.message,
                "result": result
            }
            print(json.dumps(response, indent=2))
        
        elif args.command == "approve-plan":
            result = client.approve_plan(args.session_id)
            response = {
                "status": "plan_approved",
                "session_id": args.session_id,
                "result": result
            }
            print(json.dumps(response, indent=2))
        
        elif args.command == "list-activities":
            result = client.list_activities(args.session_id, page_size=args.page_size)
            print(json.dumps(result, indent=2))
        
        elif args.command == "get-activity":
            activity = client.get_activity(args.session_id, args.activity_id)
            print(json.dumps(activity, indent=2))
        
        elif args.command == "list-sources":
            result = client.list_sources(page_size=args.page_size, filter_expr=args.filter)
            print(json.dumps(result, indent=2))
        
        elif args.command == "get-source":
            source = client.get_source(args.source_id)
            print(json.dumps(source, indent=2))

    except KeyboardInterrupt:
        error_response = {
            "error": "Operation cancelled by user",
            "status": "cancelled"
        }
        print(json.dumps(error_response, indent=2))
    except Exception as e:
        error_response = {
            "error": str(e),
            "status": "error"
        }
        print(json.dumps(error_response, indent=2))

if __name__ == "__main__":
    main()