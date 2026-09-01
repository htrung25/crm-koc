export enum EStorageObjectState {
  /** Object đã tạo trên R2 nhưng chưa dòng DB nào tham chiếu. */
  PENDING = 0,
  /** Có dòng DB trỏ tới. Không bao giờ bị sweep đụng. */
  LINKED = 1,
  /** Không còn ai tham chiếu, chờ xoá thật. */
  GARBAGE = 2,
}
