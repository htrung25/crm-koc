import * as SecureStore from 'expo-secure-store';

/**
 * Bọc SecureStore để lỗi keychain (máy bị khoá, user xoá key) không làm crash
 * app — mọi thao tác đọc coi như "không có giá trị".
 */
export const secureStorage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ghi hỏng thì lần sau người dùng đăng nhập lại, không có gì để cứu
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // đã không còn thì thôi
    }
  },
};
