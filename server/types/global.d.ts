declare global {
  var mongoose: {
    conn: any;
    promise: any;
  };

  namespace Express {
    interface User {
      _id: string;
      googleId: string;
      email: string;
      name: string;
      profilePhoto?: string;
      role: 'manager' | 'employee' | 'admin';
    }
  }
}

export {};
