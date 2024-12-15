# anime_recommendations_back

A backend application for recommending anime based on user preferences

## Recommendation System

The recommendation system provides anime recommendations based on the user's preferences

Here's a brief overview of how it works:

1. **Data Retrieval**:

   - **Redis Cache**: The system first checks Redis to see if recommendations are already cached. If so, it quickly returns these cached recommendations.
   - **Database Query**: If no cached recommendations exist, it queries all anime that the user has liked.

2. **Feature Extraction**:

   - **Genres**: The system creates a genre vector, assigning 1 for present genres and 0 for absent ones

   - **Episodes and Air Date**: The system calculates the standard deviation for the number of episodes and air dates from user-selected anime to find anime of the same duration and release period

3. **Recommendation Generation**:

   - **Filtering**: It filters out anime already in the user’s favorites and limits recommendations to similar episode counts and air dates.
   - **Cosine Similarity**: Calculates similarity based on genre vectors and synopsis content using cosine similarity for more relevant recommendations

4. **Caching**: After calculating recommendations, it stores the result in Redis with a TTL of 24h

5. **Response**: Finally, the system returns a list of recommended anime to the user.

## install

- Clone the repository

  ```
  git clone https://github.com/Fileurix3/anime_recommendations_back.git
  ```

- Go to the folder with this application

  ```
  cd anime_recommendations_back
  ```

- Install dependencies

  ```
  npm i
  ```

- Compile this app

  ```
  npm run build
  ```

- Start this app
  ```
  npm start
  ```

## Dependencies

- **[@sequelize/core](https://www.npmjs.com/package/@sequelize/core)**  
  ORM for SQL, used to interact with PostgreSQL

- **[@sequelize/postgres](https://www.npmjs.com/package/@sequelize/postgres)**  
  PostgreSQL dialect for Sequelize

- **[bcrypt](https://www.npmjs.com/package/bcrypt)**  
  for hashing passwords securely

- **[cookie-parser](https://www.npmjs.com/package/cookie-parser)**  
  to handle cookies in Express

- **[dotenv](https://www.npmjs.com/package/dotenv)**  
  to manage environment variables from a `.env` file

- **[express](https://www.npmjs.com/package/express)**  
  framework for building APIs and web applications

- **[jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)**  
  for creating and verifying JSON Web Tokens (JWT) for secure user authentication

- **[redis](https://www.npmjs.com/package/redis)**  
  for caching and managing session data

## Dev Dependencies

- **[@types/bcrypt](https://www.npmjs.com/package/@types/bcrypt)**  
  Type definitions for bcrypt

- **[@types/cookie-parser](https://www.npmjs.com/package/@types/cookie-parser)**  
  Type definitions for cookie-parser

- **[@types/express](https://www.npmjs.com/package/@types/express)**  
  Type definitions for Express

- **[@types/jsonwebtoken](https://www.npmjs.com/package/@types/jsonwebtoken)**  
  Type definitions for jsonwebtoken

- **[@types/node](https://www.npmjs.com/package/@types/node)**  
  Type definitions for Node.js

- **[chai](https://www.npmjs.com/package/chai)**  
  assertion library for testing

- **[mocha](https://www.npmjs.com/package/mocha)**  
  JavaScript test framework for Node.js

- **[nodemon](https://www.npmjs.com/package/nodemon)**  
  utility that automatically restarts the Node.js application when file changes are detected

- **[supertest](https://www.npmjs.com/package/supertest)**  
  library for testing HTTP servers

- **[typescript](https://www.npmjs.com/package/typescript)**  
  TypeScript compiler to add static types to JavaScript
