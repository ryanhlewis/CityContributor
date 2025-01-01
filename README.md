# City Contributor: Crowdsourced City Data

We demonstrate a simple framework for **crowdsourced data archiving**. A Python FastAPI server hosts city datasets locally, and a React app allows:

- **City Admin** to upload, edit, or delete datasets.  
- **Contributors** (or any user) to download datasets. After downloading, they can register as a “known contributor” by re-hosting the file elsewhere. Once five contributors are verified to hold the dataset, the city’s *original file is deleted*.

This approach saves municipal storage costs and ensures the data persists among a distributed network of community volunteers.

![image](https://github.com/user-attachments/assets/65458e68-7813-48e3-952b-7823522b9720)
![image](https://github.com/user-attachments/assets/76ae03ed-0d74-4008-99a6-5f4bcc49ce2f)

## Why It Benefits the City

- **Storage Costs**: Most cities I collaborate with automatically delete local copies after retention periods, while crowdsourcing allows deletion after enough verified mirrors exist.   
- **Distributed Resilience**: Researchers and residents can contribute by hosting files and keeping them available long-term. This allows no central point of failure, as well as a public "seeder list" of hosts, replicating the distributed gains of torrenting.

![image](https://github.com/user-attachments/assets/d285663d-38f4-497d-88a9-af1d9d0ebdb5)


## How to Run

### 1. Server

1. Install Python dependencies, start:

   ```bash
   cd server
   pip install -r requirements.txt
   python server.py
   ```


This runs a FastAPI application on port **8000**, storing uploaded datasets in `server/data/datasets/`, along with metadata in `server/data/datasets.json` and `server/data/contributors.json`.

### 2. Client

1. Install Node dependencies:

   ```bash
   npm install
   ```

2. Run the development server:

   ```bash
   npm run start
   ```

This launches the React app on **http://localhost:3000**.

3. **Optional**: Build a production bundle:

   ```bash
   npm run build
   ```

You’ll find the production-optimized static files in `build/`.

---

## Usage

- Open **http://localhost:3000** in your browser.  
- Use the top-right toggle to switch between:
  - **Contributor View**: Download a dataset and optionally register as a known host.  
  - **City Admin View**: Upload new datasets, edit titles/descriptions, or delete existing datasets.  

After five contributors have successfully verified a dataset, the server removes its own copy to save storage space. The server automatically redirects new download requests to one of the known contributors at random.

## Future Extensions

- **Re-check Active Hosts**: The city should periodically confirm that contributors’ links remain valid. If the number of active hosts drops below five, the city can restore its local copy from one of the known contributors using the hash to verify.  

We use a Python server in this demo to show how this works, but in reality, a production implementation will use serverless functions and link to a production database like AWS or Google Cloud. We welcome any production pull requests or cities that are interested in testing- reach out to rl869@cornell.edu.

![image](https://github.com/user-attachments/assets/d10a8ac8-39d3-43a0-8204-75033032c044)

![image](https://github.com/user-attachments/assets/0b8d7524-2be8-4b9b-9e31-b735931be0a7)

