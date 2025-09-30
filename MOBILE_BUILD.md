# 📱 Build APK Mobile avec Docker

## 🎯 Commandes rapides

### Générer un APK

```bash
# 1. Build de l'image (première fois: ~15-20 min, ensuite: ~5-10 min)
docker compose --profile mobile build mobile-apk-builder

# 2. Générer l'APK
docker compose --profile mobile run --rm mobile-apk-builder

# 3. Récupérer l'APK
docker cp area_mobile_apk_builder:/app/build/app/outputs/flutter-apk/app-release.apk ./app-release.apk

# 4. Installer sur votre appareil
adb install app-release.apk
```

---