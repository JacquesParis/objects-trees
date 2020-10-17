export class NotFoundError extends Error {
  statusCode: number;

  constructor(error: Error) {
    super(error.message);
    this.statusCode = 404;
  }
}
