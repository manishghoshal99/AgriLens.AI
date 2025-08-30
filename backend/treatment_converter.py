import json
import os
from pathlib import Path

def convert_treatment_files():
    """Convert treatment .txt files to structured JSON"""
    treatment_dir = Path("treatment_data")
    treatment_data = {}
    
    if not treatment_dir.exists():
        print("Treatment data directory not found")
        return
        
    for txt_file in treatment_dir.glob("*.txt"):
        disease_name = txt_file.stem
        print(f"Processing: {disease_name}")
        
        try:
            with open(txt_file, 'r', encoding='utf-8') as f:
                content = f.read().strip()
            
            # For healthy plants, structure is simpler
            if "healthy" in disease_name.lower() or "Healthy" in disease_name:
                treatment_data[disease_name] = {
                    "type": "healthy",
                    "description": content,
                    "symptoms": "",
                    "cycle_lethality": "",
                    "organic_solutions": "",
                    "inorganic_solutions": "", 
                    "sources": ""
                }
            else:
                # Parse structured disease information
                sections = content.split("Symptoms:")
                basics = sections[0].replace("Basics:", "").strip() if len(sections) > 0 else ""
                
                if len(sections) > 1:
                    remaining = sections[1]
                    
                    # Split by Cycle and Lethality
                    cycle_split = remaining.split("Cycle and Lethality:")
                    symptoms = cycle_split[0].strip() if len(cycle_split) > 0 else ""
                    
                    if len(cycle_split) > 1:
                        organic_split = cycle_split[1].split("Organic Solutions:")
                        cycle_lethality = organic_split[0].strip() if len(organic_split) > 0 else ""
                        
                        if len(organic_split) > 1:
                            inorganic_split = organic_split[1].split("Inorganic Solutions:")
                            organic_solutions = inorganic_split[0].strip() if len(inorganic_split) > 0 else ""
                            
                            if len(inorganic_split) > 1:
                                src_split = inorganic_split[1].split("Src:")
                                inorganic_solutions = src_split[0].strip() if len(src_split) > 0 else ""
                                sources = src_split[1].strip() if len(src_split) > 1 else ""
                            else:
                                inorganic_solutions = ""
                                sources = ""
                        else:
                            organic_solutions = ""
                            inorganic_solutions = ""
                            sources = ""
                    else:
                        cycle_lethality = ""
                        organic_solutions = ""
                        inorganic_solutions = ""
                        sources = ""
                else:
                    symptoms = ""
                    cycle_lethality = ""
                    organic_solutions = ""
                    inorganic_solutions = ""
                    sources = ""
                
                treatment_data[disease_name] = {
                    "type": "disease",
                    "description": basics,
                    "symptoms": symptoms,
                    "cycle_lethality": cycle_lethality,
                    "organic_solutions": organic_solutions,
                    "inorganic_solutions": inorganic_solutions,
                    "sources": sources
                }
                    
        except Exception as e:
            print(f"Error processing {disease_name}: {e}")
            treatment_data[disease_name] = {
                "type": "error",
                "description": "Treatment information unavailable",
                "symptoms": "",
                "cycle_lethality": "",
                "organic_solutions": "",
                "inorganic_solutions": "",
                "sources": ""
            }
    
    # Save to JSON
    with open("treatment_data.json", 'w', encoding='utf-8') as f:
        json.dump(treatment_data, f, indent=2, ensure_ascii=False)
    
    print(f"Converted {len(treatment_data)} treatment files to JSON")
    return treatment_data

if __name__ == "__main__":
    convert_treatment_files()