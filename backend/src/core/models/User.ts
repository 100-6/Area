import Database from '../../shared/database/connection';

interface UserData {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  registration_method?: string;
}

interface UserResult {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  created_at: Date;
}

class UserModel {
  private db = Database.getInstance();

  /**
   * Vérifier si un utilisateur existe déjà par email
   */
  async findByEmail(email: string): Promise<boolean> {
    const query = 'SELECT id FROM users WHERE email = $1';
    const result = await this.db.getPool().query(query, [email]);
    return result.rows.length > 0;
  }

  /**
   * Créer un nouvel utilisateur
   */
  async create(userData: UserData): Promise<UserResult> {
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name, registration_method) 
      VALUES ($1, $2, $3, $4, $5) 
      RETURNING id, email, first_name, last_name, created_at
    `;
    
    const values = [
      userData.email,
      userData.password_hash,
      userData.first_name,
      userData.last_name,
      userData.registration_method || 'email'
    ];

    const result = await this.db.getPool().query(query, values);
    return result.rows[0];
  }
}

export default UserModel;
