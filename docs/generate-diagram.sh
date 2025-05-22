#!/bin/zsh

# generate-diagram.sh - A script to generate diagrams from mermaid files
# Author: Melvin Rinkleff

# Check for required commands
if ! command -v npx &> /dev/null; then
    echo "Error: npx is required but not installed. Please install Node.js and npm."
    exit 1
fi

# Function to convert mermaid to png
convert_mermaid_to_png() {
    local input_file=$1
    local output_file=${2:-$(basename "$input_file" .mmd).png}
    local theme=${3:-default}
    
    echo "Generating diagram from $input_file to $output_file"
    
    # Install @mermaid-js/mermaid-cli if not already installed
    if ! npx -p @mermaid-js/mermaid-cli mmdc --version &> /dev/null; then
        echo "Installing @mermaid-js/mermaid-cli..."
        npm install -g @mermaid-js/mermaid-cli
    fi
    
    # Generate PNG from mermaid file
    npx -p @mermaid-js/mermaid-cli mmdc \
        -i "$input_file" \
        -o "$output_file" \
        -t "$theme" \
        -b transparent
    
    # Check if generation was successful
    if [ $? -eq 0 ]; then
        echo "✓ Successfully generated diagram at $output_file"
    else
        echo "✗ Failed to generate diagram"
        exit 1
    fi
}

# Function to create network diagram from docker-compose
generate_network_diagram() {
    local output_dir=${1:-"./docs"}
    local mermaid_file="$output_dir/network-diagram.mmd"
    local output_file="$output_dir/network-diagram.png"
    
    # Create output directory if it doesn't exist
    mkdir -p "$output_dir"
    
    # Create mermaid file based on the NETWORK.md documentation
    cat > "$mermaid_file" << 'EOF'
graph TD
    Internet1[Internet] -->|port 80/443| Nginx
    Nginx -->|reverse proxy| MainApp[Main-App]
    Nginx -->|reverse proxy| ChangeDetection
    MainApp --> Postgres
    ChangeDetection --> PlaywrightChrome[Playwright-Chrome]
    ChangeDetection --> TorPrivoxy
    PlaywrightChrome --> TorPrivoxy
    TorPrivoxy --> Internet2[Internet]
    
    subgraph public_network [Public Network]
        Nginx
    end
    
    subgraph change_network [Change Network]
        MainApp
        ChangeDetection
        Nginx
    end
    
    subgraph db_network [Database Network]
        MainApp
        Postgres
    end
    
    subgraph browser_network [Browser Network]
        ChangeDetection
        PlaywrightChrome
    end
    
    subgraph proxy_network [Proxy Network]
        ChangeDetection
        PlaywrightChrome
        TorPrivoxy
    end
    
    subgraph tor_network [Tor Network]
        TorPrivoxy
    end
    
    classDef external fill:#f96,stroke:#333,stroke-width:2px;
    classDef internal fill:#9cf,stroke:#333,stroke-width:1px;
    class Internet1,Internet2 external;
    class Nginx,MainApp,ChangeDetection,PlaywrightChrome,Postgres,TorPrivoxy internal;
EOF

    # Convert mermaid to PNG
    convert_mermaid_to_png "$mermaid_file" "$output_file" "forest"
    
    echo "Network diagram created at $output_file"
}

# Main execution
case "$1" in
    "--help"|"-h")
        echo "Usage: $0 [OPTION] [INPUT_FILE] [OUTPUT_FILE]"
        echo ""
        echo "Options:"
        echo "  --network, -n    Generate network diagram based on docker-compose"
        echo "  --file, -f       Convert a specific mermaid file to PNG"
        echo "  --help, -h       Show this help message"
        echo ""
        echo "Examples:"
        echo "  $0 --network                     Generate network diagram"
        echo "  $0 --network ./docs              Generate network diagram in ./docs directory"
        echo "  $0 --file diagram.mmd            Convert diagram.mmd to diagram.png"
        echo "  $0 --file diagram.mmd output.png Convert diagram.mmd to output.png"
        ;;
    "--network"|"-n")
        output_dir=${2:-"."}
        generate_network_diagram "$output_dir"
        ;;
    "--file"|"-f")
        if [ -z "$2" ]; then
            echo "Error: Input file is required"
            exit 1
        fi
        convert_mermaid_to_png "$2" "$3"
        ;;
    *)
        if [ -z "$1" ]; then
            echo "Error: No option specified. Use --help for usage information."
            exit 1
        elif [ -f "$1" ]; then
            # Assume it's a file if no option is specified
            convert_mermaid_to_png "$1" "$2"
        else
            echo "Error: Invalid option or file not found. Use --help for usage information."
            exit 1
        fi
        ;;
esac

exit 0
